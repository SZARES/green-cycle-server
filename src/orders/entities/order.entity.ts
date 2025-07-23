import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum OrderType {
  PURCHASE = 'purchase',
  EXCHANGE = 'exchange',
}

@Schema({ timestamps: true })
export class Order extends Document {
    
  @Prop({ unique: true, match: /^ORD-\d{4}-\d{6}$/ })
  orderNumber: string;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  buyerId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  sellerId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [{
      productId: { type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true, min: 1 },
      unitPrice: { type: Number, required: true, min: 0 },
      totalPrice: { type: Number, required: true, min: 0 },
    }],
    required: true,
    minlength: 1,
  })
  items: Array<{
    productId: MongooseSchema.Types.ObjectId;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ min: 0 })
  taxes: number;

  @Prop({ min: 0 })
  shippingCost: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ required: true, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ required: true, enum: OrderType, default: OrderType.PURCHASE })
  orderType: OrderType;

  @Prop({
    type: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: 'Perú' },
    },
    required: true,
  })
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Prop()
  estimatedDeliveryDate: Date;

  @Prop()
  actualDeliveryDate: Date;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({ type: Object })
  paymentDetails: Record<string, any>;

  @Prop({
    type: {
      offeredProductIds: [{ type: MongooseSchema.Types.ObjectId, ref: 'Product' }],
      exchangeTerms: String,
    },
  })
  exchangeDetails?: {
    offeredProductIds: MongooseSchema.Types.ObjectId[];
    exchangeTerms: string;
  };

  @Prop()
  trackingNumber: string;

  @Prop()
  notes: string;

  @Prop()
  sellerNotes: string;

  @Prop()
  cancelReason: string;

  @Prop({
    type: {
      co2Saved: { type: Number, default: 0 },
      wasteReduced: { type: Number, default: 0 },
    },
  })
  ecoImpact: {
    co2Saved: number;
    wasteReduced: number;
  };

  @Prop()
  confirmedAt: Date;

  @Prop()
  shippedAt: Date;

  @Prop()
  deliveredAt: Date;

  // Métodos de instancia
  calculateTotal(): void {
    this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
    this.totalAmount = this.subtotal + (this.taxes || 0) + (this.shippingCost || 0);
  }

  canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING].includes(this.status);
  }

  updateStatus(newStatus: OrderStatus): boolean {
    const validTransitions = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
      [OrderStatus.PREPARING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.DELIVERED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
    };

    if (validTransitions[this.status]?.includes(newStatus)) {
      this.status = newStatus;
      return true;
    }
    return false;
  }
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Índices
OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ sellerId: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'items.productId': 1 });
OrderSchema.index({ buyerId: 1, status: 1 });
OrderSchema.index({ sellerId: 1, paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });

// Pre-save hook removido - orderNumber se maneja en el servicio
