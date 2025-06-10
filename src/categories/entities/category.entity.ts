import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true, unique: true, minlength: 2, maxlength: 50 })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop()
  description?: string;

  @Prop()
  icon?: string;

  @Prop()
  color?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  parentCategory?: Category;

  @Prop({ default: true })
  isEcoFriendly: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: {
      seoTitle: String,
      seoDescription: String,
      keywords: [String],
    },
  })
  metadata?: {
    seoTitle?: string;
    seoDescription?: string;
    keywords?: string[];
  };
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Índices
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ name: 1 }, { unique: true });
CategorySchema.index({ isActive: 1, sortOrder: 1 });
CategorySchema.index({ parentCategory: 1 });
