import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { ProductStatus, ProductCondition } from '../products/entities/product.entity';

@Injectable()
export class SeederService {
  private readonly ecoCategories = [
    'Orgánico',
    'Reciclado',
    'Artesanal',
    'Biodegradable',
    'Comercio Justo',
    'Energía Renovable',
    'Reutilizable',
    'Eco-amigable',
    'Hogar',
    'Moda',
    'Electrónica',
    'Muebles',
    'Transporte',
    'Niños',
    'Jardín',
    'Libros',
    'Deportes',
  ];

  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private async createCategory(name: string): Promise<Category> {
    const slug = this.generateSlug(name);
    const existingCategory = await this.categoryModel.findOne({ slug });

    if (existingCategory) {
      return existingCategory;
    }

    const category = new this.categoryModel({
      name,
      slug,
      description: `Productos ${name.toLowerCase()} sostenibles y eco-amigables`,
      isEcoFriendly: true,
      isActive: true,
      metadata: {
        seoTitle: `Productos ${name} Eco-amigables | GreenCycle`,
        seoDescription: `Descubre nuestra selección de productos ${name.toLowerCase()} sostenibles y eco-amigables`,
        keywords: [name.toLowerCase(), 'eco', 'sostenible', 'verde'],
      },
    });

    return category.save();
  }

  private generateProductData(category: Category, index: number) {
    const productName = `${category.name} Producto ${index + 1}`;
    const slug = this.generateSlug(productName);

    return {
      name: productName,
      slug,
      description: `Este es un producto ${category.name.toLowerCase()} eco-amigable de alta calidad. Diseñado pensando en la sostenibilidad y el medio ambiente.`,
      images: [
        'https://example.com/placeholder1.jpg',
        'https://example.com/placeholder2.jpg',
      ],
      category: category._id,
      price: Math.floor(Math.random() * 1000) + 10,
      currency: 'PEN',
      forBarter: Math.random() > 0.7,
      barterPreferences: ['Productos orgánicos', 'Material reciclado'],
      stock: Math.floor(Math.random() * 100) + 1,
      stockUnit: 'unidad',
      isUnlimitedStock: false,
      ecoBadges: [category.name],
      ecoSaving: Math.floor(Math.random() * 50) + 1,
      sustainabilityScore: Math.floor(Math.random() * 100) + 1,
      materials: ['Material reciclado', 'Material biodegradable'],
      isHandmade: Math.random() > 0.5,
      isOrganic: Math.random() > 0.5,
      location: {
        city: 'Lima',
        region: 'Lima',
        coordinates: {
          lat: -12.0464,
          lng: -77.0428,
        },
      },
      shippingOptions: {
        localPickup: true,
        homeDelivery: true,
        shipping: true,
        shippingCost: Math.floor(Math.random() * 50) + 10,
      },
      status: ProductStatus.ACTIVE,
      condition: ProductCondition.NEW,
      publishedAt: new Date(),
      seller: '000000000000000000000000', // ID temporal, debe ser reemplazado
      isVerifiedSeller: true,
      tags: [category.name.toLowerCase(), 'eco', 'sostenible'],
      searchKeywords: [
        category.name.toLowerCase(),
        'eco',
        'sostenible',
        'verde',
        'producto',
      ],
      metadata: {
        seoTitle: `${productName} | GreenCycle`,
        seoDescription: `Descubre este increíble producto ${category.name.toLowerCase()} eco-amigable`,
      },
    };
  }

  async seed() {
    try {
      console.log('Iniciando proceso de seeding...');

      // Crear categorías
      for (const categoryName of this.ecoCategories) {
        const category = await this.createCategory(categoryName);
        console.log(`Categoría creada: ${category.name}`);

        // Crear 10 productos para cada categoría
        for (let i = 0; i < 10; i++) {
          const productData = this.generateProductData(category, i);
          const existingProduct = await this.productModel.findOne({
            slug: productData.slug,
          });

          if (!existingProduct) {
            const product = new this.productModel(productData);
            await product.save();
            console.log(`Producto creado: ${product.name}`);
          } else {
            console.log(`Producto ya existe: ${productData.name}`);
          }
        }
      }

      console.log('Proceso de seeding completado exitosamente');
      return { message: 'Seeding completado exitosamente' };
    } catch (error) {
      console.error('Error durante el proceso de seeding:', error);
      throw error;
    }
  }
} 