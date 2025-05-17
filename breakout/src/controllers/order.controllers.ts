import { Controller, Get, Param, Query, NotFoundException, InternalServerErrorException, UseGuards, Body, Patch } from '@nestjs/common';
import { AuthTokenGuard } from 'src/guards/JwtStrategy.guards';
import { OrdersService } from 'src/services/order.services';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Get()
  @UseGuards(AuthTokenGuard)
  async findAll(@Query('businessId') businessId: string) {
    try {
      return await this.ordersService.findAll(businessId);
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('Failed to fetch orders');
    }
  }

  @Get(':id')
  @UseGuards(AuthTokenGuard)
  async findOne(@Param('id') id: string) {
    try {
      const order = await this.ordersService.findOne(id);
      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      return order;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch order');
    }
  }

  @Patch('/status/:orderId')
  @UseGuards(AuthTokenGuard)
  async updateStatus(@Body() body: { status: string },@Param('orderId') orderId:string) {
    const { status } = body;

    return await this.ordersService.updateStatus(orderId, status);

  }
}