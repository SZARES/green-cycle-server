import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartItem } from './entities/cart.entity';
import { Product } from '../products/entities/product.entity';
import { Order, OrderStatus, PaymentStatus, OrderType } from '../orders/entities/order.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
  ) {}

  // Obtener o crear carrito del usuario
  async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartModel.findOne({ userId: new Types.ObjectId(userId) });
    
    if (!cart) {
      cart = new this.cartModel({
        userId: new Types.ObjectId(userId),
        items: [],
      });
      await cart.save();
    }
    
    return cart;
  }

  // Obtener carrito con productos populados
  async getCart(userId: string): Promise<Cart> {
    const cart = await this.cartModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .populate('items.productId')
      .populate('items.sellerId', 'name email');
    
    if (!cart) {
      return await this.getOrCreateCart(userId);
    }
    
    // Actualizar información de productos en el carrito
    await this.updateCartItemsInfo(cart);
    
    return cart;
  }

  // Agregar item al carrito
  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<Cart> {
    const { productId, quantity } = addToCartDto;
    
    // Verificar que el producto existe y está disponible
    const product = await this.productModel.findById(productId).populate('seller', 'name');
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    
    if (product.status !== 'active') {
      throw new BadRequestException('El producto no está disponible');
    }
    
    if (product.stock < quantity && !product.isUnlimitedStock) {
      throw new BadRequestException('Stock insuficiente');
    }
    
    const cart = await this.getOrCreateCart(userId);
    
    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );
    
    if (existingItemIndex >= 0) {
      // Actualizar cantidad
      cart.items[existingItemIndex].quantity += quantity;
      
      // Verificar stock nuevamente
      if (product.stock < cart.items[existingItemIndex].quantity && !product.isUnlimitedStock) {
        throw new BadRequestException('Stock insuficiente para la cantidad total');
      }
    } else {
      // Agregar nuevo item
      const seller = product.seller as any; // Cast para evitar problemas de tipos con populate
              cart.items.push({
        productId: productId as any,
        quantity,
        addedAt: new Date(),
        productName: product.name,
        productImage: product.images[0] || '',
        unitPrice: product.price,
        sellerId: seller._id,
        sellerName: seller.name || '',
      });
    }
    
    await cart.save();
    return this.getCart(userId);
  }

  // Actualizar cantidad de un item
  async updateCartItem(
    userId: string, 
    productId: string, 
    updateCartItemDto: UpdateCartItemDto
  ): Promise<Cart> {
    const { quantity } = updateCartItemDto;
    
    const cart = await this.getOrCreateCart(userId);
    const itemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );
    
    if (itemIndex < 0) {
      throw new NotFoundException('Producto no encontrado en el carrito');
    }
    
    // Verificar stock
    const product = await this.productModel.findById(productId);
    if (product && product.stock < quantity && !product.isUnlimitedStock) {
      throw new BadRequestException('Stock insuficiente');
    }
    
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    
    return this.getCart(userId);
  }

  // Eliminar item del carrito
  async removeFromCart(userId: string, productId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    
    cart.items = cart.items.filter(
      item => item.productId.toString() !== productId
    );
    
    await cart.save();
    return this.getCart(userId);
  }

  // Limpiar carrito
  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    cart.totalItems = 0;
    cart.totalAmount = 0;
    cart.lastModified = new Date();
    await cart.save();
    return cart;
  }

  // Checkout - Crear órdenes por vendedor
  async checkout(userId: string, checkoutDto: CheckoutDto): Promise<Order[]> {
    const cart = await this.getCart(userId);
    
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('El carrito está vacío');
    }
    
    // Agrupar items por vendedor manualmente
    const sellerGroups = new Map<string, CartItem[]>();
    
    cart.items.forEach(item => {
      const sellerId = item.sellerId?.toString() || 'unknown';
      if (!sellerGroups.has(sellerId)) {
        sellerGroups.set(sellerId, []);
      }
      sellerGroups.get(sellerId)!.push(item);
    });
    const orders: Order[] = [];
    
    try {
      // Crear una orden por cada vendedor
      for (const sellerId of Array.from(sellerGroups.keys())) {
        if (sellerId === 'unknown') continue;
        const items = sellerGroups.get(sellerId)!;
        
        // Calcular totales para este vendedor
        const subtotal = items.reduce((sum, item) => 
          sum + (item.quantity * (item.unitPrice || 0)), 0
        );
        const totalAmount = subtotal; // Sin impuestos ni envío por ahora
        
        // Generar orderNumber si no se proporciona
        let orderNumber = checkoutDto.orderNumber;
        if (!orderNumber) {
          const date = new Date();
          const year = date.getFullYear();
          const count = await this.orderModel.countDocuments();
          orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
        }

        // Crear orden
        const orderData = {
          orderNumber,
          buyerId: new Types.ObjectId(userId),
          sellerId: new Types.ObjectId(sellerId),
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.quantity * (item.unitPrice || 0),
          })),
          subtotal,
          totalAmount,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          orderType: OrderType.PURCHASE,
          shippingAddress: {
            street: checkoutDto.shippingAddress.street,
            city: checkoutDto.shippingAddress.city,
            state: checkoutDto.shippingAddress.state || checkoutDto.shippingAddress.city,
            zipCode: checkoutDto.shippingAddress.zipCode,
            country: checkoutDto.shippingAddress.country || 'Perú',
          },
          paymentMethod: 'pending', // Se definirá después entre comprador y vendedor
          notes: checkoutDto.shippingAddress.notes || checkoutDto.notes || '',
        };
        
        const order = new this.orderModel(orderData);
        await order.save();
        orders.push(order);
      }
      
      // Limpiar carrito después del checkout exitoso
      await this.clearCart(userId);
      
      return orders;
      
    } catch (error) {
      // Si algo falla, intentar eliminar las órdenes creadas
      for (const order of orders) {
        await this.orderModel.findByIdAndDelete(order._id);
      }
      throw new BadRequestException('Error al procesar el checkout: ' + error.message);
    }
  }

  // Actualizar información de productos en el carrito
  private async updateCartItemsInfo(cart: Cart): Promise<void> {
    let hasChanges = false;
    
    for (const item of cart.items) {
      const product = await this.productModel
        .findById(item.productId)
        .populate('seller', 'name');
      
      if (product) {
        const seller = product.seller as any; // Cast para evitar problemas de tipos con populate
        
        if (item.productName !== product.name ||
            item.productImage !== product.images[0] ||
            item.unitPrice !== product.price ||
            item.sellerName !== seller.name) {
          
          item.productName = product.name;
          item.productImage = product.images[0] || '';
          item.unitPrice = product.price;
          item.sellerId = seller._id;
          item.sellerName = seller.name || '';
          hasChanges = true;
        }
      }
    }
    
    if (hasChanges) {
      await cart.save();
    }
  }

  // Obtener resumen del carrito
  async getCartSummary(userId: string): Promise<{
    totalItems: number;
    totalAmount: number;
    sellers: number;
  }> {
    const cart = await this.getCart(userId);
    
    // Agrupar items por vendedor manualmente
    const sellerGroups = new Map<string, CartItem[]>();
    
    if (cart && cart.items) {
      cart.items.forEach(item => {
        const sellerId = item.sellerId?.toString() || 'unknown';
        if (!sellerGroups.has(sellerId)) {
          sellerGroups.set(sellerId, []);
        }
        sellerGroups.get(sellerId)!.push(item);
      });
    }
    
    return {
      totalItems: cart?.totalItems || 0,
      totalAmount: cart?.totalAmount || 0,
      sellers: sellerGroups.size,
    };
  }
} 