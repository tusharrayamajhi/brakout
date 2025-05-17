import { Controller, Get, Param } from '@nestjs/common';
import { SolanaPayService } from 'src/services/solana.services';

@Controller()
export class SolanaPayController {
  constructor(private readonly solanaPayService: SolanaPayService) {}

  @Get('solana/:orderId/:customerId/:businessId')
  async createPayment(@Param('orderId') orderId: string, @Param('customerId') customerId: string, @Param('businessId') businessId: string) {
    console.log(orderId, customerId, businessId)
    const data = await this.solanaPayService.createPaymentLink({orderId:orderId, customerId:customerId, businessId:businessId});
    console.log(data)
    return data;
  }
}