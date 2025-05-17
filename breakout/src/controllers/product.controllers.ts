import { Controller, Get, Post,  Delete, Body, Param, NotFoundException, InternalServerErrorException, Query, UseGuards, Req, Patch } from '@nestjs/common';
import { Request } from 'express';
import { ProductDto } from 'src/DTO/product.dto';
import { AuthTokenGuard } from 'src/guards/JwtStrategy.guards';
import { ProductService } from 'src/services/product.services';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  @UseGuards(AuthTokenGuard)
  async create(@Body() productDto: ProductDto, @Req() req: Request) {

    return await this.productService.create(productDto, req);

  }

  @Get()
  @UseGuards(AuthTokenGuard)
  async findAll(@Req() req: Request) {
    try {
      return await this.productService.findAll(req);
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  @Get('/:id')
  @UseGuards(AuthTokenGuard)
  async findOne(@Param('id') id: string, @Query('businessId') businessId: string) {
    try {
      const product = await this.productService.findOne(id, businessId);
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found for business ${businessId}`);
      }
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch product');
    }
  }

  @Patch(':id')
  @UseGuards(AuthTokenGuard)
  async update(@Param('id') id: string, @Body() productDto: ProductDto) {
    try {
      const product = await this.productService.update(id, productDto);
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  @Delete(':id/:businessId')
  @UseGuards(AuthTokenGuard)
  async remove(@Param('id') id: string, @Query('businessId') businessId: string) {
    try {
      const result = await this.productService.remove(id, businessId);
      if (!result) {
        throw new NotFoundException(`Product with ID ${id} not found for business ${businessId}`);
      }
      return { message: `Product with ID ${id} deleted successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete product');
    }
  }
}