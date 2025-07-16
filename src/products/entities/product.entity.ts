import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Category } from '../../categories/entities/category.entity';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  OUT_OF_STOCK = 'out_of_stock',
  SOLD = 'sold',
  ARCHIVED = 'archived',
}

export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, minlength: 3, maxlength: 100 })
  name: string;

  @Prop({ required: true, minlength: 10, maxlength: 1000 })
  description: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: [String], required: true, min: 1, max: 10 })
  images: string[];

  // @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category', required: true })
  // category: Category;
  @Prop({ required: true})
  category: string

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  subcategory?: Category;

  // Pricing & Exchange
  @Prop({ min: 0, default: 0 })
  price: number;

  @Prop({ default: 'PEN' })
  currency: string;

  @Prop({ default: false })
  forBarter: boolean;

  @Prop({ type: [String] })
  barterPreferences?: string[];

  // Inventory
  @Prop({ min: 0, default: 0 })
  stock: number;

  @Prop({ default: 'unidad' })
  stockUnit: string;

  @Prop({ default: false })
  isUnlimitedStock: boolean;

  // Eco Properties
  @Prop({ type: [String], max: 5 })
  ecoBadges: string[];

  @Prop()
  ecoSaving?: number;

  @Prop({ min: 1, max: 100 })
  sustainabilityScore?: number;

  @Prop({ type: [String] })
  materials?: string[];

  @Prop({ default: false })
  isHandmade: boolean;

  @Prop({ default: false })
  isOrganic: boolean;

  // Location & Shipping
  @Prop({
    type: {
      city: { type: String, required: true },
      region: { type: String, required: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    required: true,
  })
  location: {
    city: string;
    region: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  @Prop({
    type: {
      localPickup: { type: Boolean, default: true },
      homeDelivery: { type: Boolean, default: false },
      shipping: { type: Boolean, default: false },
      shippingCost: Number,
    },
    default: {},
  })
  shippingOptions: {
    localPickup: boolean;
    homeDelivery: boolean;
    shipping: boolean;
    shippingCost?: number;
  };

  // Product Status
  @Prop({ type: String, enum: ProductStatus, default: ProductStatus.DRAFT })
  status: ProductStatus;

  @Prop({ type: String, enum: ProductCondition, required: true })
  condition: ProductCondition;

  @Prop()
  publishedAt?: Date;

  @Prop()
  soldAt?: Date;

  // Seller Info
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  seller: MongooseSchema.Types.ObjectId;

  @Prop()
  isVerifiedSeller: boolean;

  // Engagement
  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  favorites: number;

  @Prop({ default: 0 })
  inquiries: number;

  @Prop({ default: 0 })
  shares: number;

  // SEO & Search
  @Prop({ type: [String] })
  tags: string[];

  @Prop({ type: [String] })
  searchKeywords: string[];

  @Prop({
    type: {
      seoTitle: String,
      seoDescription: String,
    },
  })
  metadata?: {
    seoTitle?: string;
    seoDescription?: string;
  };

  // Additional timestamps
  @Prop()
  lastViewedAt?: Date;

  @Prop()
  featuredUntil?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Índices
ProductSchema.index({ category: 1, status: 1, publishedAt: -1 });
ProductSchema.index({ seller: 1, status: 1, updatedAt: -1 });
ProductSchema.index({ status: 1, publishedAt: -1 });
ProductSchema.index({ 'location.coordinates': '2dsphere' });
ProductSchema.index({ 'location.city': 1, status: 1 });
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ views: -1 });
ProductSchema.index({ featuredUntil: 1 });
