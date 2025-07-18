import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      const order = new this.orderModel(createOrderDto);
      order.calculateTotal();
      return await order.save();
    } catch (error) {
      throw new BadRequestException('Error al crear la orden: ' + error.message);
    }
  }

  async findAll(query: any = {}): Promise<Order[]> {
    return this.orderModel.find(query)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .populate('items.productId')
      .exec();

    if (!order) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    return order;
  }

  async findByUser(userId: string, role: 'buyer' | 'seller'): Promise<Order[]> {
    const query = role === 'buyer' ? { buyerId: userId } : { sellerId: userId };
    return this.orderModel.find(query)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email')
      .populate('items.productId')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    
    // Validar transición de estado si se está actualizando
    if (updateOrderDto.status && !order.updateStatus(updateOrderDto.status)) {
      throw new BadRequestException('Transición de estado no válida');
    }

    // Actualizar timestamps según el estado
    const updateData: any = { ...updateOrderDto };
    if (updateOrderDto.status) {
      switch (updateOrderDto.status) {
        case OrderStatus.CONFIRMED:
          updateData.confirmedAt = new Date();
          break;
        case OrderStatus.SHIPPED:
          updateData.shippedAt = new Date();
          break;
        case OrderStatus.DELIVERED:
          updateData.deliveredAt = new Date();
          break;
      }
    }

    const updatedOrder = await this.orderModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
    .populate('buyerId', 'name email')
    .populate('sellerId', 'name email')
    .populate('items.productId')
    .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    return updatedOrder;
  }

  async remove(id: string): Promise<void> {
    const result = await this.orderModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    
    if (!order.updateStatus(status)) {
      throw new BadRequestException('No se puede cambiar al estado solicitado');
    }

    return this.update(id, { status });
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
    return this.update(id, { paymentStatus });
  }

  async addTrackingInfo(id: string, trackingNumber: string): Promise<Order> {
    return this.update(id, { 
      trackingNumber,
      status: OrderStatus.SHIPPED,
      shippedAt: new Date()
    });
  }

  

  async getOrderStats(): Promise<any> {
    const stats = await this.orderModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await this.orderModel.countDocuments();
    const totalAmount = await this.orderModel.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    return {
      byStatus: stats,
      totalOrders,
      totalAmount: totalAmount[0]?.total || 0
    };
  }

  async getEcoImpactStats(): Promise<any> {
    return this.orderModel.aggregate([
      {
        $group: {
          _id: null,
          totalCo2Saved: { $sum: '$ecoImpact.co2Saved' },
          totalWasteReduced: { $sum: '$ecoImpact.wasteReduced' }
        }
      }
    ]);
  }

  // Métodos para vendedores

  async getPendingSellerOrders(sellerId: string): Promise<Order[]> {
    return this.orderModel
      .find({ 
        sellerId: new Types.ObjectId(sellerId), 
        status: OrderStatus.PENDING 
      })
      .populate('buyerId', 'name email')
      .populate('items.productId', 'name images')
      .sort('-createdAt')
      .exec();
  }

  async getAllSellerOrders(sellerId: string, status?: string): Promise<Order[]> {
    const filter: any = { sellerId: new Types.ObjectId(sellerId) };
    if (status) {
      filter.status = status;
    }
    
    return this.orderModel
      .find(filter)
      .populate('buyerId', 'name email')
      .populate('items.productId', 'name images')
      .sort('-createdAt')
      .exec();
  }

  // Métodos para compradores

  async getBuyerOrders(buyerId: string, status?: string): Promise<Order[]> {
    const filter: any = { buyerId: new Types.ObjectId(buyerId) };
    if (status) {
      filter.status = status;
    }
    
    return this.orderModel
      .find(filter)
      .populate('sellerId', 'name email')
      .populate('items.productId', 'name images')
      .sort('-createdAt')
      .exec();
  }

  // Aprobar orden (vendedor)
  async approveOrder(orderId: string, sellerId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }
    
    if (order.sellerId.toString() !== sellerId) {
      throw new ForbiddenException('No tienes permiso para aprobar esta orden');
    }
    
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Solo se pueden aprobar órdenes pendientes');
    }
    
    order.status = OrderStatus.CONFIRMED;
    order.confirmedAt = new Date();
    
    return await order.save();
  }

  // Rechazar orden (vendedor)
  async rejectOrder(orderId: string, sellerId: string, reason?: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }
    
    if (order.sellerId.toString() !== sellerId) {
      throw new ForbiddenException('No tienes permiso para rechazar esta orden');
    }
    
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Solo se pueden rechazar órdenes pendientes');
    }
    
    order.status = OrderStatus.CANCELLED;
    order.cancelReason = reason || 'Rechazado por el vendedor';
    
    return await order.save();
  }

  // Marcar como enviado (vendedor)
  async markAsShipped(orderId: string, sellerId: string, trackingNumber?: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }
    
    if (order.sellerId.toString() !== sellerId) {
      throw new ForbiddenException('No tienes permiso para marcar esta orden como enviada');
    }
    
    if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PREPARING) {
      throw new BadRequestException('La orden debe estar confirmada o en preparación para ser enviada');
    }
    
    order.status = OrderStatus.SHIPPED;
    order.shippedAt = new Date();
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    return await order.save();
  }

  // Marcar como entregado (comprador)
  async markAsDelivered(orderId: string, buyerId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }
    
    if (order.buyerId.toString() !== buyerId) {
      throw new ForbiddenException('No tienes permiso para marcar esta orden como entregada');
    }
    
    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('La orden debe estar enviada para ser marcada como entregada');
    }
    
    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    order.actualDeliveryDate = new Date();
    
    return await order.save();
  }

  // Cancelar orden (comprador o vendedor)
  async cancelOrder(orderId: string, userId: string, reason?: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }
    
    // Verificar permisos (comprador o vendedor)
    const isBuyer = order.buyerId.toString() === userId;
    const isSeller = order.sellerId.toString() === userId;
    
    if (!isBuyer && !isSeller) {
      throw new ForbiddenException('No tienes permiso para cancelar esta orden');
    }
    
    if (!order.canBeCancelled()) {
      throw new BadRequestException('Esta orden no puede ser cancelada en su estado actual');
    }
    
    order.status = OrderStatus.CANCELLED;
    order.cancelReason = reason || (isBuyer ? 'Cancelado por el comprador' : 'Cancelado por el vendedor');
    
    return await order.save();
  }
}
