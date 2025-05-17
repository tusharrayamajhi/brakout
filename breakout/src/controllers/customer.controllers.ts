import { Controller, Get, Param, NotFoundException, InternalServerErrorException, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthTokenGuard } from 'src/guards/JwtStrategy.guards';
import { customerService } from 'src/services/customer.services';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: customerService) {}

  @Get()
  @UseGuards(AuthTokenGuard)
  async findAll(@Req() req:Request) {
    try {
      return await this.customerService.findAll(req);
    } catch (error) {
        console.log(error)
      throw new InternalServerErrorException('Failed to fetch customers');
    }
  }

  @Get(':id')
  @UseGuards(AuthTokenGuard)
  async findOne(@Param('id') id: string) {
    try {
      const customer = await this.customerService.findOne(id);
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${id} not found`);
      }
      return customer;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch customer');
    }
  }
}