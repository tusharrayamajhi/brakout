
import { Injectable, Inject } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/entities/Product.entities';
import { Equal, Repository } from 'typeorm';
import { Orders } from 'src/entities/Order.entities';
import { SocialPage } from 'src/entities/socialmedia.entities';
import { OrderItem } from 'src/entities/OrderItem.entities';
import { Customer } from 'src/entities/Customer.entities';
import { v4 as uuid4 } from 'uuid';
import * as CryptoJS from 'crypto-js';
import axios from 'axios';
import { PaymentData, PaymentMethodType } from 'src/entities/paymentDetails';
import { Business } from 'src/entities/business.entities';
import { Shipping } from 'src/entities/Shipping.entities';



@Injectable()
export class StripeService {
  private stripe: Stripe;
 
  constructor(
    @Inject(ConfigService) private readonly config: ConfigService,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(SocialPage) private readonly pageRepo: Repository<SocialPage>,
    @InjectRepository(OrderItem) private readonly itemRepo: Repository<OrderItem>,
    @InjectRepository(Orders) private readonly orderRepo: Repository<Orders>,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(PaymentData) private readonly paymentData: Repository<PaymentData>,
    @InjectRepository(Business) private readonly businessRepo: Repository<Business>,
    @InjectRepository(Shipping) private readonly shippingRepo: Repository<Shipping>,
  ) {
    this.stripe = new Stripe(String(this.config.get("STRIPE_SECRET_KEY")));
   
  }



  async generateStripePaymentLink(data: any, id: string, pageId: string) {

    try {
      const page = await this.pageRepo.findOne({ where: { pageId: pageId }, relations: { business: true } })
      if(!page) return {message:"page not found"}
      const busienss = await this.businessRepo.findOne({where:{id:Equal(page.business.id)}})
      if(!busienss) return {message:"business not found"}
      const customer = await this.customerRepo.findOne({ where: { id: id } })
      if (!customer) {
        return { message: "invalid customer id" }
      }
      let stripeUserId: string = ''
      let esewaSecret: string = ''
      let walletkey: string = ''
      const paymentData = await this.paymentData.find({ where: { business: Equal(page?.business.id) } })
      if (!paymentData || paymentData.length == 0) {
        return { message: "currently not payment method found" }
      }
      for (const data of paymentData) {
        if (data.methodType == PaymentMethodType.ESEWA) {
          esewaSecret = data.merchantCode || '';
        } else if (data.methodType == PaymentMethodType.STRIPE) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          stripeUserId = data.stripeUserId || '';
        } else if (data.methodType == PaymentMethodType.SOLANA) {
          walletkey = data.walletAddress || '';
        }
      }

      // Parse the stringified JSON safely
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const orders = typeof data.orders === 'string' ? JSON.parse(data.orders) : data.orders;
      const lineItems: any[] = [];
      const orderItem: any[] = [];
      let totalPrice: number = 0;
     

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!orders || !orders.order) {
        return {message:'Invalid orders format please format the in correct json format'}
      }
      
      
      
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      for (const item of orders.order) {
        console.log(item)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const productData = await this.productRepo.findOne({ where: { id: item.product_id } })
        if (!productData) {
          console.log("product not found")
          return { message: "product not found invalid id" }
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/await-thenable
        orderItem.push(this.itemRepo.create({ price: productData.price, quantity: item.quantity, product: productData }))
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const finalPrice = +productData.price * item.quantity
        totalPrice += totalPrice + finalPrice
        // Step 1: Create product
        const product = await this.stripe.products.create({
          images: [productData.imageUrl],
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          name: item.product_name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          description: `Size: ${item.size}, Color: ${item.color}`,
          metadata: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
            product_id: item.product_id,
          },
        });
        
        // Step 2: Create price (set your actual pricing logic here)
        const price = await this.stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(+productData.price * 100), // hardcoded $20.00, replace with real logic
          currency: 'usd',
        });

        // Step 3: Add to line items
        lineItems.push({
          price: price.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          quantity: item.quantity,
        });
      }
      const order = this.orderRepo.create({
        customer: customer,
        orderItem: orderItem,
        total_amount: totalPrice,
        business:busienss,
      })

      console.log(order)
      const result = await this.orderRepo.save(order);
      console.log(data)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const address = this.shippingRepo.create({order:result,shippingAddress:orders.shipping_address,email:orders.email,phone:orders.phone})
      const finaddress = await this.shippingRepo.save(address);
      console.log(finaddress)
      console.log(result)
      if (!result) {
        return { message: "something went wrong" }
      }
      console.log(result)
      const account = await this.stripe.accounts.retrieve('acct_1RMpvSPvKr1TtgLg');
      console.log(account); // Should return account info if it exists
      // Step 4: Create Checkout Session
      const session = await this.stripe.checkout.sessions.create({
        line_items: lineItems,
        mode: 'payment',
        success_url: `http://localhost:5678/webhook/3dfb292b-9497-444d-8259-9f91d2c7b2ae/success?session_id={CHECKOUT_SESSION_ID}&orderId=${result.id}&userId=${id}&page_id=${pageId}&businessId=${page?.business.id}&method=stripe`,
        cancel_url: `http://localhost:3000/cancel`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        customer_email: data.email,
        metadata: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          phone: data.phone,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          shipping_address: data.shipping_address,
          user_id: id,
          page_id: pageId,
        },

      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const esewaLink: any = await this.generateEsewaPaymentLink({ amount:(totalPrice * 130), successUrl: `http://localhost:5678/webhook/3dfb292b-9497-444d-8259-9f91d2c7b2ae/success?orderId=${result.id}&userId=${id}&page_id=${pageId}&businessId=${page?.business.id}&method=esewa`, failureUrl: "http://localhost:3000/cancel", secretKey: esewaSecret, baseUrl: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form' })
      


      return {
        strip: session.url,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        esewa: esewaLink,
        solanaLink: `http://localhost:5173/solana/${result.id}/${id}/${page?.business.id}`,
        message: 'Payment link generated successfully send only a payment link asked by customer',
        status: 200,

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data
      };

      // Proceed with using the orders object...
    } catch (err) {
      console.error('Invalid orders JSON:', err);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return {message:'Invalid orders format please format in the correct json',data:data};
    }



    // console.log(paymentLink)
    // return paymentLink
  }



  async generateEsewaPaymentLink({ amount, successUrl, failureUrl, secretKey, baseUrl }) {
    const formData = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      amount: amount.toString(),
      tax_amount: '0',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      total_amount: amount.toString(),
      transaction_uuid: uuid4(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      product_code: 'EPAYTEST',
      product_service_charge: '0',
      product_delivery_charge: '0',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      success_url: successUrl,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      failure_url: failureUrl,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
    };

    const dataToSign = `total_amount=${formData.total_amount},transaction_uuid=${formData.transaction_uuid},product_code=${formData.product_code}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const hash = CryptoJS.HmacSHA256(dataToSign, secretKey);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const signature = CryptoJS.enc.Base64.stringify(hash);

    const payload = {
      ...formData,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      signature,
    };

    const urlEncodedData = new URLSearchParams(payload).toString();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await axios.post(baseUrl, urlEncodedData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.status === 200) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      return response.request.res.responseUrl;
    } else {
      return { message: "esewa un available" };
    }
  }


}