import { HttpException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Orders } from 'src/entities/Order.entities';
import { Repository } from 'typeorm';

@Injectable()
export class OrdersService {
 
  constructor(
    @InjectRepository(Orders)
    private ordersRepository: Repository<Orders>,
  ) {}

  async findAll(businessId: string): Promise<Orders[]> {
    try {
      const query = this.ordersRepository.createQueryBuilder('order')
        .leftJoinAndSelect('order.customer', 'customer')
        .leftJoinAndSelect('order.orderItem', 'orderItem')
        .leftJoinAndSelect('orderItem.product', 'product')
        .leftJoinAndSelect('order.payment', 'payment')

      if (businessId) {
        query.where('order.business= :business', { business:businessId });
      }
      query.orderBy('order.createdAt', 'DESC');

      return await query.getMany();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }

  async findOne(id: string): Promise<Orders | null> {
    try {
      const query = this.ordersRepository.createQueryBuilder('order')
        .leftJoinAndSelect('order.customer', 'customer')
        .leftJoinAndSelect('order.orderItem', 'orderItem')
        .leftJoinAndSelect('orderItem.product', 'product')
        .leftJoinAndSelect('order.payment', 'payment')
        // .where('order.id = :id', { id });

      if (id) {
        query.andWhere('order.id = :id', { id });
      }

      return await query.getOne();
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to fetch order');
    }
  }

   async updateStatus(orderId: string, status: string) {
    try{
      return await this.ordersRepository.update(orderId, { status: status })
    }catch(err){
      console.log(err)
      return new HttpException("internal server error",500)
    }
  }
}