import { MessageServices } from 'src/services/message.services';
import { Body, Controller, Get, HttpException, HttpStatus, Param, Post } from "@nestjs/common";
import { customerService } from 'src/services/customer.services';
import { InjectRepository } from '@nestjs/typeorm';
import { SocialPage } from 'src/entities/socialmedia.entities';
import { Repository, Equal } from 'typeorm';
import { Customer } from 'src/entities/Customer.entities';
import { Product } from 'src/entities/Product.entities';
import { Orders } from 'src/entities/Order.entities';
import { StripeService } from 'src/services/stripe.services';

@Controller()
export class N8NController{
    
    constructor(
        private readonly messageService:MessageServices,
        private readonly customerService:customerService,
        private readonly stripeService:StripeService,
        @InjectRepository(SocialPage) private readonly pageRepo: Repository<SocialPage>,
        @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
        @InjectRepository(Product) private readonly productRepo: Repository<Product>,
        @InjectRepository(Orders) private readonly OrderRepo: Repository<Orders>,

    ){}

    @Get('/chat/history/:id')
    async getCustomerChatHistoryData(@Param('id') id:string){
        console.log(id)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const history = await this.messageService.getHistoryMessage({senderId:id})
        return history
    }

    @Post('/customer/add/:id/:pageId')
    async addCustomer(@Param('id') id:string,@Param('pageId') pageId:string){
        try{
            const exits = await this.customerService.findOne(id)
            if(exits) return {message:"customer already exists",status:HttpStatus.OK,customer:exits}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const customer = await this.customerService.GetUserData(pageId,id)
            if(!customer) return {message:"customer not found"}
            const user =  await this.customerService.SaveCustomer(pageId,customer)
            return {message:"Saved customer successfully",customer:user,status:HttpStatus.OK}

        }catch(err){
            console.log(err)
            return new HttpException("internal server error",HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }


    @Get("/business/:pageId")
    async getBusinessData(@Param('pageId') pageId:string){
        const business = await this.pageRepo.findOne({where:{pageId:pageId},relations:{business:true}})
        return business
    }

    @Get("/details/customer/:id")
    async getCustomerData(@Param('id') id:string){
        const customer = await this.customerRepo.findOne({where:{id:id}})
        return customer
    }

    @Get("/product/:pageId")
    async geProductData(@Param('pageId') pageId:string){
        const page = await this.pageRepo.findOne({where:{pageId:pageId},relations:{business:true}})
        if(!page) return new HttpException("page not found",HttpStatus.NOT_FOUND)
        const product = await this.productRepo.find({where:{business:Equal(page.business.id)}})
        if(!product) return new HttpException("product not found",HttpStatus.NOT_FOUND)
        return product
    }
    @Post('save/message/:id')
    async saveCustomerMessage(@Param('id') id:string,@Body('message') message:{text:string,mid:string}){
      
        return await this.messageService.saveMessage({message:message,senderId:id})
    }


    @Get("/order/:id")
    async getCustomerOrderData(@Param('id') id:string){
        const customer = await this.customerRepo.findOne({where:{id:id},relations:{orders:true}})
        if(!customer) return new HttpException("invalid customer id",HttpStatus.NOT_FOUND)
        return customer.orders
    }

    @Get("/paymentlink/:id/:pageId")
    async getPaymentLink(@Body() body:any,@Param('id') id:string,@Param('pageId') pageId:string){
        return await this.stripeService.generateStripePaymentLink(body,id,pageId);
    }

}