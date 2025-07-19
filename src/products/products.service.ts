import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductStatus } from './entities/product.entity';
import { UploadService } from '../upload/upload.service';
import { CategoriesService } from 'src/categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private uploadService: UploadService,
    private categoriesService: CategoriesService
  ) {}

  async create(createProductDto: CreateProductDto) {
    try {
      // Validar que las imágenes sean URLs válidas de Cloudinary si se proporcionan
      if (createProductDto.images && createProductDto.images.length > 0) {
        for (const imageUrl of createProductDto.images) {
          if (!this.uploadService.isCloudinaryUrl(imageUrl)) {
            throw new BadRequestException('Las imágenes deben ser URLs válidas de Cloudinary');
          }
        }
      }

      const product = new this.productModel(createProductDto);
      return await product.save();
    } catch (error) {
      throw error;
    }
  }

  async createWithImages(createProductDto: CreateProductDto, files: Express.Multer.File[], seller) {
    try {
      // Subir imágenes a Cloudinary
      const imageUrls = await this.uploadService.uploadMultipleImages(files);
      
      // Asignar las URLs de las imágenes al DTO
      
      // Crear el producto
      // console.log(createProductDto);
      // return;
      
      // let p = JSON.parse(createProductDto);
      
      const product = new this.productModel();
      
      let obj: any = createProductDto;
      
      for(let name in JSON.parse(obj)) {
        product[name] = JSON.parse(obj)[name];
      }
      product.images = imageUrls;
      product.seller = seller;

      
      // product.images = imageUrls;
      // product.set('images', imageUrls)
      const savedProduct = await product.save();
      
      return {
        success: true,
        message: 'Producto creado exitosamente con imágenes',
        product: savedProduct,
        uploadedImages: imageUrls.length
      };
    } catch (error) {
      // Si hay error, intentar eliminar las imágenes subidas
      if (createProductDto.images && createProductDto.images.length > 0) {
        try {
          const publicIds = createProductDto.images.map(url => 
            this.uploadService.getPublicIdFromUrl(url)
          );
          await this.uploadService.deleteMultipleImages(publicIds);
        } catch (deleteError) {
          console.error('Error al eliminar imágenes después de fallo:', deleteError);
        }
      }
      
      throw error;
    }
  }

  async findAll(query: any = {}) {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      category,
      status,
      minPrice,
      maxPrice,
      search,
      location,
      ecoBadges,
      isHandmade,
      isOrganic,
      forBarter,
    } = query;

    const filter: any = {};

    // Filtros básicos
    if (category) {
      filter.category = new Types.ObjectId(category);
    }
    if (status) {
      filter.status = status;
    } else {
      // Por defecto, excluir productos archivados
      filter.status = { $ne: ProductStatus.ARCHIVED };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (location) {
      filter['location.city'] = new RegExp(location, 'i');
    }
    if (ecoBadges) {
      filter.ecoBadges = { $in: ecoBadges.split(',') };
    }
    if (isHandmade !== undefined) {
      filter.isHandmade = isHandmade === 'true';
    }
    if (isOrganic !== undefined) {
      filter.isOrganic = isOrganic === 'true';
    }
    if (forBarter !== undefined) {
      filter.forBarter = forBarter === 'true';
    }

    // Búsqueda por texto
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions = sort.split(',').reduce((acc, curr) => {
      const [field, order] = curr.startsWith('-') 
        ? [curr.substring(1), -1] 
        : [curr, 1];
      acc[field] = order;
      return acc;
    }, {});

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async findActive(query: any = {}) {
    const {
      page = 1,
      limit = 10,
      sort = '-createdAt',
      category,
      minPrice,
      maxPrice,
      search,
      location,
      ecoBadges,
      isHandmade,
      isOrganic,
      forBarter,
    } = query;

    const filter: any = {
      status: ProductStatus.ACTIVE, // Solo productos activos
    };

    // Filtros básicos
    if (category) {
      filter.category = new Types.ObjectId(category);
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (location) {
      filter['location.city'] = new RegExp(location, 'i');
    }
    if (ecoBadges) {
      filter.ecoBadges = { $in: ecoBadges.split(',') };
    }
    if (isHandmade !== undefined) {
      filter.isHandmade = isHandmade === 'true';
    }
    if (isOrganic !== undefined) {
      filter.isOrganic = isOrganic === 'true';
    }
    if (forBarter !== undefined) {
      filter.forBarter = forBarter === 'true';
    }

    // Búsqueda por texto
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortOptions = sort.split(',').reduce((acc, curr) => {
      const [field, order] = curr.startsWith('-') 
        ? [curr.substring(1), -1] 
        : [curr, 1];
      acc[field] = order;
      return acc;
    }, {});

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug')
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async findOne(id: string) {
    const product = await this.productModel
      .findOne({ 
        _id: id,
        status: { $ne: ProductStatus.ARCHIVED }
      })
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug')
      .populate('seller', 'name email');

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    // Incrementar vistas
    await this.productModel.findByIdAndUpdate(id, {
      $inc: { views: 1 },
      lastViewedAt: new Date(),
    });

    return product;
  }

  // Método interno para verificar propiedad sin incrementar vistas
  async findOneInternal(id: string) {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }



  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const product = await this.productModel
        .findByIdAndUpdate(id, updateProductDto, { new: true })
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug');

      if (!product) {
        throw new NotFoundException(`Producto con ID ${id} no encontrado`);
      }

      return product;
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    const product = await this.productModel.findByIdAndUpdate(
      id,
      { status: ProductStatus.ARCHIVED },
      { new: true },
    );

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return { message: 'Producto archivado exitosamente' };
  }

  async findByCategory(categoryId: string, query: any = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {
      category: new Types.ObjectId(categoryId),
      status: { $ne: ProductStatus.ARCHIVED },
    };

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug'),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async findBySeller(sellerId: string, query: any = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {
      seller: new Types.ObjectId(sellerId),
      status: { $ne: ProductStatus.ARCHIVED },
    };

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug'),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  // Método para obtener todos los productos del vendedor (incluyendo archivados)
  async findAllBySeller(sellerId: string, query: any = {}) {
    const { page = 1, limit = 10, sort = '-createdAt' } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {
      seller: new Types.ObjectId(sellerId),
    };

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(Number(limit))
        .populate('category', 'name slug')
        .populate('subcategory', 'name slug'),
      this.productModel.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async findFeatured() {
    return this.productModel
      .find({
        status: ProductStatus.ACTIVE,
        featuredUntil: { $gt: new Date() },
      })
      .sort({ featuredUntil: -1 })
      .limit(10)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug');
  }

  async findPopular() {
    return this.productModel
      .find({ status: ProductStatus.ACTIVE })
      .sort({ views: -1 })
      .limit(10)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug');
  }

  async findNearby(coordinates: { lat: number; lng: number }, maxDistance: number = 10000) {
    return this.productModel
      .find({
        status: ProductStatus.ACTIVE,
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [coordinates.lng, coordinates.lat],
            },
            $maxDistance: maxDistance,
          },
        },
      })
      .limit(20)
      .populate('category', 'name slug')
      .populate('subcategory', 'name slug');
  }
}
