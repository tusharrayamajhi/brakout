import { HttpStatusCode } from 'axios';
import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductDto } from 'src/DTO/product.dto';
import { Business } from 'src/entities/business.entities';
import { Product } from 'src/entities/Product.entities';
import { User } from 'src/entities/user.entities';
import { Repository, Equal } from 'typeorm';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(Business) private BusinessRepository: Repository<Business>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(productDto: ProductDto,req:any): Promise<Product> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        const user = await this.userRepository.findOne({where:{googleId:Equal(req.user.sub)},relations:{businesses:true}})
        if(!user) throw new InternalServerErrorException('User not found');
      const business = await this.BusinessRepository.findOne({ where: {id:Equal(user.businesses.id)}});
      if (!business) throw new InternalServerErrorException('Business not found for this user');
      const product = this.productRepository.create({ ...productDto, business });
    
      return await this.productRepository.save(product);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to create product');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findAll(req:any): Promise<Product[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const user = await this.userRepository.findOne({where:{googleId:req.user.sub},relations:{businesses:true}})
      const products =  await this.productRepository.find({where:{business:{id:user?.businesses.id}}});
      console.log(products)
      return products
    }
     catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to fetch products');
    }
  }

  async findOne(id: string, businessId: string){
    try {
        const business = await this.BusinessRepository.findOneBy({ id: businessId });
        if (!business) {
          return new HttpException("business not found", HttpStatusCode.NotFound);
        }
      return await this.productRepository.findOne({where:{ id:Equal(id), business: Equal(business.id)} });
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to fetch product');
    }
  }

  async update(id: string, productDto: ProductDto) {
    try {
      const product = await this.productRepository.findOneBy({ id });
      if (!product) {
        return new HttpException("product not found", HttpStatusCode.NotFound);
      }
      await this.productRepository.update({ id }, productDto);
      return await this.productRepository.findOneBy({ id });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to update product');
    }
  }

  async remove(id: string, businessId: string){
    try {
        const business = await this.BusinessRepository.findOne({where:{id:businessId}})
        if (!business) {
          return new HttpException("business not found", HttpStatusCode.NotFound);
        }
      const product = await this.productRepository.findOneBy({ id, business: business });
      if (!product) {
        return new HttpException("product not found", HttpStatusCode.NotFound);
      }
      await this.productRepository.delete(id);
      return true;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to delete product');
    }
  }
}