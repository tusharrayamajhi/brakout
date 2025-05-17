import { HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { BusinessDto } from 'src/DTO/business.dto';
import { Business } from 'src/entities/business.entities';
import { User } from 'src/entities/user.entities';
import { Equal, Repository } from 'typeorm';

@Injectable()
export class BusinessService {

  constructor(
    @InjectRepository(Business) private businessRepository: Repository<Business>,
    @InjectRepository(User) private UserRepository: Repository<User>,
  ) { }

  async create(businessDto: BusinessDto, req: any) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log(req.user)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const user = await this.UserRepository.findOne({ where: { googleId: req.user.sub },relations:{businesses:true} })
      console.log("user",user)
      if (!user) {
        console.log("user not found")
        return;
      }
      if (user.businesses != null) {
        return { message: "business already exits" }
      }
      const bus = await this.businessRepository.findOne({ where: { email: businessDto.email } })
      if (bus) {
        return { message: "this email already exits" }
      }
      console.log(user)
      const business = this.businessRepository.create({ ...businessDto, user: user });
      await this.businessRepository.save(business);
      return { message: "business created successfully", status:HttpStatus.OK }
    } catch (error) {
      console.log(error)
      throw new InternalServerErrorException('Failed to create business');
    }
  }

  async CheckBusinesExits(req: any) {
    try{
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const user = await this.UserRepository.findOne({where:{googleId:req.user.sub},relations:{businesses:true}})
      console.log(user)
      if(!user){
        return {message:"user doesn't exits",exists:false}
      }
      if(!user.businesses){
        return {message:"business doesn't exists",exists:false}
      }
      return {message:"business exists",exists:true}
    }catch(err){
      console.log(err)
      return false
    }
  }

  async findOne(id: string, req: Request): Promise<Business | null> {
    try {
      return await this.businessRepository.findOneBy({ id: Equal(id), user: req.user });
    } catch (error) {
      console.log(error)

      throw new InternalServerErrorException('Failed to fetch business');
    }
  }

  async update(id: string, businessDto: BusinessDto, req: any): Promise<Business | null> {
    try {
      
      const business = await this.businessRepository.findOne({where:{ id: Equal(id)} });
      if (!business) {
        return null;
      }
      console.log("business found")
      console.log(business)
      await this.businessRepository.update(id, businessDto);
      return await this.businessRepository.findOneBy({ id });
    } catch (error) {
      console.log(error)

      throw new InternalServerErrorException('Failed to update business');
    }
  }

  async remove(id: string): Promise<boolean> {
    try {
      const business = await this.businessRepository.findOneBy({ id });
      if (!business) {
        return false;
      }
      await this.businessRepository.delete(id);
      return true;
    } catch (error) {
      console.log(error)

      throw new InternalServerErrorException('Failed to delete business');
    }
  }
  
}