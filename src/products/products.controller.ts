import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, UseGuards, Request } from '@nestjs/common';
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
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
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
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
