/* eslint-disable @typescript-eslint/no-unsafe-return */
import { HttpException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { Customer } from "src/entities/Customer.entities";
import { InjectRepository } from "@nestjs/typeorm";
import { Equal, In, Repository } from "typeorm";
import axios, { HttpStatusCode } from "axios";
import { SocialPage } from "src/entities/socialmedia.entities";
import { User } from "src/entities/user.entities";

@Injectable()
export class customerService {

    constructor(
        @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
        @InjectRepository(SocialPage) private readonly pageRepo: Repository<SocialPage>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) { }


    async SaveCustomer(pageId: string, customer: { id: string, name: string }) {
        try {
            const page = await this.pageRepo.findOne({ where: { pageId: Equal(pageId) } })
            if (!page) return new HttpException("page not found", HttpStatusCode.NotFound)
            const cos = this.customerRepo.create({ id: customer.id, fullName: customer.name, socialPage: page })
            if (!cos) return new HttpException("cannot create customer object", HttpStatusCode.InternalServerError)
            return await this.customerRepo.save(cos)
        } catch (err) {
            console.log(err)
            return new HttpException("cannot save customer data in database", HttpStatusCode.InternalServerError)
        }
    }

    async GetUserData(pageId: string, senderId: string) {
        try {
            const page = await this.pageRepo.findOne({ where: { pageId: Equal(pageId) } })
            if (!page) return new HttpException("page not found", HttpStatusCode.NotFound)
            const response = await axios.get(`https://graph.facebook.com/v18.0/${senderId}?fields=id,name,profile_pic&access_token=${page?.accessToken}`);
            return response.data
        } catch (err) {
            console.log(err)
        }
    }

    async findAll(req: any) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            const user = await this.userRepo.findOne({ where: { googleId: req.user.sub }, relations: { businesses: true } })
            console.log("user", user)
            if (!user) return new HttpException("user not found", HttpStatusCode.NotFound)
            const pages = await this.pageRepo.find({ where: { business: Equal(user.businesses.id) } })
            if (!pages) return new HttpException("no pages found", HttpStatusCode.NotFound)
            console.log("page", pages)
            const ids: string[] = []
            for (const page of pages) {
                ids.push(page.id)
            }
            console.log("ids", ids)
            return await this.customerRepo.find({ where: { socialPage: In(ids) }, relations: { socialPage: true } });
        } catch (error) {
            console.log(error)
            throw new InternalServerErrorException('Failed to fetch customers');
        }
    }

    async findOne(id: string): Promise<Customer | null> {
        try {
            return await this.customerRepo.findOneBy({ id: Equal(id) });
        } catch (error) {
            console.log(error)
            throw new InternalServerErrorException('Failed to fetch customer');
        }
    }
}