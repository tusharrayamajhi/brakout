import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, InternalServerErrorException, UseGuards, Req, ValidationPipe } from '@nestjs/common';
import { Request } from 'express';
import { BusinessDto } from 'src/DTO/business.dto';
import { AuthTokenGuard } from 'src/guards/JwtStrategy.guards';
import { BusinessService } from 'src/services/business.services';

@Controller('businesses')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @UseGuards(AuthTokenGuard)
  async create(@Body(new ValidationPipe({whitelist: true}),) businessDto: BusinessDto,@Req() req:Request) {
    try {
      console.log(businessDto)
      return await this.businessService.create(businessDto,req);
    } catch (error) {
        console.log(error)
      throw new InternalServerErrorException('Failed to create business');
    }
  }


  @Get('/checkbusinessprofile')
  @UseGuards(AuthTokenGuard)
  async CheckBusiness(@Req() req:Request){
    try{
      return await this.businessService.CheckBusinesExits(req);
    }catch(err){
      console.log(err)
    }
  }


  @Get(':id')
  @UseGuards(AuthTokenGuard)
  async findOne(@Param('id') id: string,@Req() req:Request) {
    try {
      const business = await this.businessService.findOne(id,req);
      if (!business) {
        throw new NotFoundException(`Business with ID ${id} not found`);
      }
      return business;
    } catch (error) {

      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch business');
    }
  }

  @Put(':id')
  @UseGuards(AuthTokenGuard)
  async update(@Param('id') id: string, @Body() businessDto: BusinessDto,@Req() req:Request) {
    try {
      const business = await this.businessService.update(id, businessDto,req);
      if (!business) {
        throw new NotFoundException(`Business with ID ${id} not found`);
      }
      return business;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update business');
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.businessService.remove(id);
      if (!result) {
        throw new NotFoundException(`Business with ID ${id} not found`);
      }
      return { message: `Business with ID ${id} deleted successfully` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete business');
    }
  }
}