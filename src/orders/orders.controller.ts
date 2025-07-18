import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }

  // Endpoints protegidos para vendedores y compradores
  
  // Obtener órdenes pendientes del vendedor
  @Get('seller/pending')
  @UseGuards(JwtAuthGuard)
  getPendingSellerOrders(@Request() req) {
    return this.ordersService.getPendingSellerOrders(req.user.id);
  }

  // Obtener todas las órdenes del vendedor
  @Get('seller/all')
  @UseGuards(JwtAuthGuard)
  getAllSellerOrders(@Request() req, @Query('status') status?: string) {
    return this.ordersService.getAllSellerOrders(req.user.id, status);
  }

  // Obtener órdenes del comprador
  @Get('buyer/all')
  @UseGuards(JwtAuthGuard)
  getBuyerOrders(@Request() req, @Query('status') status?: string) {
    return this.ordersService.getBuyerOrders(req.user.id, status);
  }

  // Aprobar orden (vendedor)
  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard)
  approveOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.approveOrder(id, req.user.id);
  }

  // Rechazar orden (vendedor)
  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard)
  rejectOrder(
    @Param('id') id: string, 
    @Request() req,
    @Body('reason') reason?: string
  ) {
    return this.ordersService.rejectOrder(id, req.user.id, reason);
  }

  // Marcar como enviado (vendedor)
  @Patch(':id/ship')
  @UseGuards(JwtAuthGuard)
  markAsShipped(
    @Param('id') id: string, 
    @Request() req,
    @Body('trackingNumber') trackingNumber?: string
  ) {
    return this.ordersService.markAsShipped(id, req.user.id, trackingNumber);
  }

  // Marcar como entregado (comprador)
  @Patch(':id/delivered')
  @UseGuards(JwtAuthGuard)
  markAsDelivered(@Param('id') id: string, @Request() req) {
    return this.ordersService.markAsDelivered(id, req.user.id);
  }

  // Cancelar orden (comprador o vendedor)
  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancelOrder(
    @Param('id') id: string, 
    @Request() req,
    @Body('reason') reason?: string
  ) {
    return this.ordersService.cancelOrder(id, req.user.id, reason);
  }
}
