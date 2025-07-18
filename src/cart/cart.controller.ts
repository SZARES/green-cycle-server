import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  Patch,
  UseGuards,
  Request
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Obtener carrito del usuario
  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  // Obtener resumen del carrito
  @Get('summary')
  getCartSummary(@Request() req) {
    return this.cartService.getCartSummary(req.user.id);
  }

  // Agregar producto al carrito
  @Post('add')
  addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, addToCartDto);
  }

  // Actualizar cantidad de un producto
  @Patch('item/:productId')
  updateCartItem(
    @Request() req,
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto
  ) {
    return this.cartService.updateCartItem(req.user.id, productId, updateCartItemDto);
  }

  // Eliminar producto del carrito
  @Delete('item/:productId')
  removeFromCart(@Request() req, @Param('productId') productId: string) {
    return this.cartService.removeFromCart(req.user.id, productId);
  }

  // Limpiar carrito
  @Delete('clear')
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }

  // Checkout - Procesar compra
  @Post('checkout')
  checkout(@Request() req, @Body() checkoutDto: CheckoutDto) {
    return this.cartService.checkout(req.user.id, checkoutDto);
  }
} 