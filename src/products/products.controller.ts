import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, UseGuards, Request, Query, ForbiddenException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsObject } from 'class-validator';


class CraeteProductFileDto {
  @IsObject()
  productData: CreateProductDto;


}


@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createProductDto: CreateProductDto, @Request() req) {
    // Asignar el vendedor automáticamente desde el token JWT
    return this.productsService.create({ ...createProductDto, seller: req.user.id });
  }

  @Post('with-images')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10, {
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.includes('image')) {
        return cb(new Error('Solo se permiten archivos de imagen'), false);
      }
      if (file.size > 5 * 1024 * 1024) {
        return cb(new Error('El archivo es demasiado grande. Máximo 5MB'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
      files: 10, // Máximo 10 archivos
    },
  }))
  async createWithImages(
    @UploadedFiles() images: Express.Multer.File[],
    @Body() createProductDto: CraeteProductFileDto,
    @Request() req
  ) {
    // Asignar el vendedor automáticamente desde el token JWT
    // console.log(req.user.id);
    // let d: any = JSON.parse(JSON.stringify(createProductDto.productData));
    // let product: any = structuredClone(d);
    // product.seller = req.user.id;
    // console.log(product);
    // return;
    // let p = {
    //   ...product,
    //   seller: req.user.id
    // }

    return this.productsService.createWithImages(createProductDto.productData, images, req.user.id);
    // return "1231231";
  }

  @Get()
  findAll(@Query() query: any) {
    return this.productsService.findAll(query);
  }

  @Get('active')
  findActive(@Query() query: any) {
    return this.productsService.findActive(query);
  }

  @Get('my-products')
  @UseGuards(JwtAuthGuard)
  findMyProducts(@Query() query: any, @Request() req) {
    // Obtener todos los productos del usuario autenticado (incluyendo archivados)
    return this.productsService.findAllBySeller(req.user.id, query);
  }

  @Get('seller/:sellerId')
  @UseGuards(JwtAuthGuard)
  findBySeller(
    @Param('sellerId') sellerId: string,
    @Query() query: any,
    @Request() req
  ) {
    // Verificar que el usuario solo pueda ver sus propios productos
    if (req.user.id !== sellerId) {
      throw new ForbiddenException('No tienes permisos para ver los productos de otro usuario');
    }
    return this.productsService.findBySeller(sellerId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // Este endpoint es público para que cualquiera pueda ver productos
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto, @Request() req) {
    // Verificar que el producto pertenece al usuario antes de actualizarlo
    const product = await this.productsService.findOneInternal(id);
    
    if (product.seller.toString() !== req.user.id) {
      throw new ForbiddenException('No tienes permisos para modificar este producto. Solo puedes modificar tus propios productos');
    }
    
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req) {
    // Verificar que el producto pertenece al usuario antes de eliminarlo
    const product = await this.productsService.findOneInternal(id);
    
    if (product.seller.toString() !== req.user.id) {
      throw new ForbiddenException('No tienes permisos para eliminar este producto. Solo puedes eliminar tus propios productos');
    }
    
    return this.productsService.remove(id);
  }
}
