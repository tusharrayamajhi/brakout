import { MessageServices } from 'src/services/message.services';
import { Body, Controller, Get, HttpException, HttpStatus, Param, Post } from "@nestjs/common";
import { customerService } from 'src/services/customer.services';
import { ResponseServices } from 'src/services/response.services';
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
        private readonly responseService:ResponseServices,
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

    @Post("/message/:id/:pageId")
    async sendMessageToCustomer(@Param('id') id:string,@Param('pageId') pageId:string,@Body('textMessage') textMessage:string){
        return await this.responseService.sendTextResponseToCustomer({senderId:id,pageId:pageId,textMessage:textMessage})
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

    // @Post('send/product/:id/:pageId')
    // async sendproduct(@Body() body:any,@Param('id') id:string,@Param('pageId') pageId:string){
    //     console.log(id);
    //     console.log(pageId);
    //     console.log(body);
    
    //     // Parse the stringified JSON message from body
    //     let data;
    //     try {
    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
    //         data = JSON.parse(body.message);
    //     } catch (error) {
    //         console.error("Error parsing JSON:", error);
    //         return;
    //     }
    //     console.log(data);
    
    //     // Check if there are images in the parsed data
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //     if (data.image) {
    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //         for (const img of data.image) {  // Corrected loop here
    //             console.log(img)
    //             // Ensure you access the correct properties from img
    //             const attachment = {
    //                 // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    //                 type: img?.image_type,
    //                 payload: {
    //                     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    //                     url: img?.imageUrl
    //                 }
    //             };
    //             await Promise.all([
    //                 this.responseService.sendAttachmentResponseToCustomer({
    //                     attachment: attachment,
    //                     senderId: id,
    //                     pageId: pageId
    //                 }),
    //                 // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    //                 this.responseService.sendTextResponseToCustomer({pageId:pageId,senderId:id,textMessage:img?.about_product})
    //             ])
    //             // Send the attachment response to the customer
    //             // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    //         }
    //     }
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //     if(data.message){
    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    //         await this.responseService.sendTextResponseToCustomer({pageId:pageId,senderId:id,textMessage:data?.message})
    //     }
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    //     return data
    // }


    @Post('send/product/:id/:pageId')
    async sendproduct(@Body() body:any,@Param('id') id:string,@Param('pageId') pageId:string){
    
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (body.response) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            for (const img of body.response.product) {  // Corrected loop here
                // Ensure you access the correct properties from img
                const attachment = {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    type: img?.image_type,
                    payload: {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                        url: img?.imageUrl
                    }
                };
                await Promise.all([
                    this.responseService.sendAttachmentResponseToCustomer({
                        attachment: attachment,
                        senderId: id,
                        pageId: pageId
                    }),
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    this.responseService.sendTextResponseToCustomer({pageId:pageId,senderId:id,textMessage:img?.aboutimage})
                ])
                // Send the attachment response to the customer
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if(body.response.message){
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            await this.responseService.sendTextResponseToCustomer({pageId:pageId,senderId:id,textMessage:body.response.message})
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if(body.response.PaymentButton){
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            await this.responseService.sendPaymentLink({senderId:id,link:body.response.url,pageId:pageId})
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        return {response:body.response,message:"successfully sent",status:HttpStatus.OK}
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