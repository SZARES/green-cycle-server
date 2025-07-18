import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export interface CartItem {
  productId: MongooseSchema.Types.ObjectId;
  quantity: number;
  addedAt: Date;
  productName?: string;
  productImage?: string;
  unitPrice?: number;
  sellerId?: MongooseSchema.Types.ObjectId;
  sellerName?: string;
}

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', unique: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({
    type: [{
      productId: { type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true, min: 1 },
      addedAt: { type: Date, default: Date.now },
      productName: String,
      productImage: String,
      unitPrice: Number,
      sellerId: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
      sellerName: String,
    }],
    default: [],
  })
  items: CartItem[];

  @Prop({ default: 0 })
  totalItems: number;

  @Prop({ default: 0 })
  totalAmount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastModified: Date;

  // Método para calcular totales
  calculateTotals(): void {
    this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.totalAmount = this.items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);
    this.lastModified = new Date();
  }

  // Método para verificar si el carrito está vacío
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  // Método para limpiar el carrito
  clear(): void {
    this.items = [];
    this.totalItems = 0;
    this.totalAmount = 0;
    this.lastModified = new Date();
  }

  // Método para agrupar items por vendedor
  groupBySeller(): Map<string, CartItem[]> {
    const groups = new Map<string, CartItem[]>();
    
    this.items.forEach(item => {
      const sellerId = item.sellerId?.toString() || 'unknown';
      if (!groups.has(sellerId)) {
        groups.set(sellerId, []);
      }
      groups.get(sellerId)!.push(item);
    });
    
    return groups;
  }
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Índices
CartSchema.index({ userId: 1 });
CartSchema.index({ 'items.productId': 1 });
CartSchema.index({ lastModified: -1 });

// Hook pre-save para actualizar totales
CartSchema.pre('save', function(next) {
  // Calcular totales directamente en el hook
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);
  this.lastModified = new Date();
  next();
}); 