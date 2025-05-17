import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { clusterApiUrl, Connection, Keypair, PublicKey } from '@solana/web3.js';
import { encodeURL } from '@solana/pay';
import BigNumber from 'bignumber.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Business } from 'src/entities/business.entities';
import { PaymentData, PaymentMethodType } from 'src/entities/paymentDetails';
import { Repository, Equal } from 'typeorm';
import { Orders } from 'src/entities/Order.entities';

@Injectable()
export class SolanaPayService {

  private connection: Connection;
  private recipient: PublicKey;
  constructor(
    @InjectRepository(PaymentData) private readonly paymentData: Repository<PaymentData>,
    @InjectRepository(Business) private readonly businessRepo: Repository<Business>,
    @InjectRepository(Orders) private readonly orderRepo: Repository<Orders>,
  ) {
    // Initialize connection to Solana devnet
    this.connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  }

  async createPaymentLink(data: { orderId: string, customerId: string, businessId: string }) {
    try {
      const business = await this.businessRepo.findOne({ where: { id: data.businessId } })
      if (!business) {
        return new HttpException("business not found", HttpStatus.NOT_FOUND)
      }
      const order = await this.orderRepo.findOne({ where: { id: data.orderId } })
      if (!order) {
        return new HttpException("order not found", HttpStatus.NOT_FOUND)
      }
      const paymentData = await this.paymentData.findOne({ where: { methodType: PaymentMethodType.SOLANA, business: Equal(business.id) } })
      if (!paymentData) {
        return new HttpException("payment data not found", HttpStatus.NOT_FOUND)
      }

      this.recipient = new PublicKey(String(paymentData.walletAddress));
      const amount = new BigNumber(0.0001);
      const reference = new Keypair().publicKey;
      const label = 'Jungle Cats store';
      const message = 'Jungle Cats store - your order - #001234';
      const memo = 'JC#4098';
      const solUrl = encodeURL({ recipient: this.recipient, amount, reference, label, message, memo });
      console.log(solUrl)
      console.log(reference)
      return { recipient: this.recipient, amount:amount, memo: 'JC#4098', label: label, message: message, solUrl,reference:reference }
    } catch (err) {
      console.log(err)
      return new HttpException("internal server error", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}