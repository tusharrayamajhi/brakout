// stripe.controller.ts
import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthTokenGuard } from 'src/guards/JwtStrategy.guards';
import { PaymentConnectService } from 'src/services/paymentconnect';

@Controller()
export class PaymentDataController {
    constructor(private readonly paymentDataService: PaymentConnectService) { }


    @Post('stripe/connect')
    @UseGuards(AuthTokenGuard)
    async stripeCallback(@Query('code') code: string, @Req() req: Request) {
        console.log("hello world")
        console.log("code", code)
        return await this.paymentDataService.handelStrip(code, req);
    }

    @Post("wallet/connect")
    @UseGuards(AuthTokenGuard)
    async hadelPantomWallet(@Req() req: Request,@Query('publickey') publickey:string) {
        console.log("hello world")
        console.log("code", publickey)
        return await this.paymentDataService.hadelPantomWallet(publickey, req);
     }

     @Post("esewa/connect")
     @UseGuards(AuthTokenGuard)
     async hadelEsewaPayment(@Req() req:Request,@Body("merchantCode") code:string){
        console.log(code)
        return await this.paymentDataService.hadelEsewaPayment(req,code)
     }

     @Get("payment")
     @UseGuards(AuthTokenGuard)
     async getAllConnectedPaymentMethod(@Req() req:Request){
        return await this.paymentDataService.getAllConnectedPaymentMethod(req)
     }
}
