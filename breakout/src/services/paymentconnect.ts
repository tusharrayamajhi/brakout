import { Equal, Repository } from 'typeorm';
// stripe.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentData, PaymentMethodType } from 'src/entities/paymentDetails';
import Stripe from 'stripe';
import { User } from 'src/entities/user.entities';
import { Business } from 'src/entities/business.entities';

@Injectable()
export class PaymentConnectService {
    
   

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(PaymentData) private readonly paymentData: Repository<PaymentData>,
        @InjectRepository(User) private readonly UserRepo: Repository<User>,
        @InjectRepository(Business) private readonly BusinessRepo: Repository<Business>,
    ) { }


    async handelStrip(code: string, req: any) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            const user = await this.UserRepo.findOne({where:{googleId:req.user.sub},relations:{businesses:true}})
            if(!user){
                return new HttpException("user not found",HttpStatus.NOT_FOUND)
            }
            const business = await this.BusinessRepo.findOne({where:{id:Equal(user.businesses.id)}})
            if(!business){
                return new HttpException("business not found",HttpStatus.NOT_FOUND)
            }
            const token: string = String(this.config.get("STRIPE_SECRET_KEY"))
            console.log("token", token)
            const stripe = new Stripe(token, {
                apiVersion: '2025-04-30.basil',
            });
            const response = await stripe.oauth.token({
                grant_type: 'authorization_code',
                code,
            });
            const account = await stripe.accounts.retrieve(String(response.stripe_user_id));
            console.log(account); // Should return account info if it exists
            console.log(response)
            let exists = await this.paymentData.findOne({ where: { methodType:PaymentMethodType.STRIPE, business:Equal(business.id) } })
            if (exists) {
                exists.stripeUserId = response.stripe_user_id;
            }else{
                exists = this.paymentData.create({ methodType: PaymentMethodType.STRIPE, stripeUserId: response.stripe_user_id, business: business })

            }
            console.log(exists)
            return await this.paymentData.save(exists)
        } catch (err) {
            console.log(err)
            return {mssage:"currently getting issue try again later"}
        }
    }


    async hadelPantomWallet(publickey: string, req: any) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            const user = await this.UserRepo.findOne({where:{googleId:req.user.sub},relations:{businesses:true}})
            if(!user){
                return new HttpException("user not found",HttpStatus.NOT_FOUND)
            }
            const business = await this.BusinessRepo.findOne({where:{id:Equal(user.businesses.id)}})
            if(!business){
                return new HttpException("business not found",HttpStatus.NOT_FOUND)
            }
            
            const key = await this.paymentData.findOne({ where: { methodType: PaymentMethodType.SOLANA, business:Equal(business.id) } })
            if(key != null){
                return {message:"wallet already connected",status:HttpStatus.OK}
            }
            const solana = this.paymentData.create({ methodType: PaymentMethodType.SOLANA, walletAddress: publickey, business: business })
            return await this.paymentData.save(solana)

        } catch (err) {
            console.log(err)
            return new HttpException("internal server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

     async hadelEsewaPayment(req: any, code: string) {
        try{
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            const user = await this.UserRepo.findOne({where:{googleId:req.user.sub},relations:{businesses:true}})
            if(!user){
                return new HttpException("user not found",HttpStatus.NOT_FOUND)
            }
            const business = await this.BusinessRepo.findOne({where:{id:Equal(user.businesses.id)}})
            if(!business){
                return new HttpException("business not found",HttpStatus.NOT_FOUND)
            }
            const merchantCode = await this.paymentData.findOne({where:{methodType:PaymentMethodType.ESEWA,business:Equal(business.id)}})
            if(merchantCode != null){
                return {message:"esewa already exists",status:HttpStatus.OK}
            } 
            const esewa = this.paymentData.create({methodType:PaymentMethodType.ESEWA,merchantCode:code,business:business})
            await this.paymentData.save(esewa)
            return {message:"merchant code connected",status:HttpStatus.OK}
        }catch(err){
            console.log(err)
            return new HttpException("internal server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getAllConnectedPaymentMethod(req: any) {
        try{
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            const user = await this.UserRepo.findOne({where:{googleId:req.user.sub},relations:{businesses:true}})
            if(!user) return new HttpException("user not found",HttpStatus.NOT_FOUND)
            return await this.paymentData.find({where:{business:Equal(user.businesses.id)}})
            
        }catch(err){
            console.log(err)
            return new HttpException("internal server error", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
