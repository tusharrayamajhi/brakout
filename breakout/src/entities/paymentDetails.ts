import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntities } from './BaseEntities.entities';
import { Business } from './business.entities';

export enum PaymentMethodType {
  STRIPE = 'stripe',
  ESEWA = 'esewa',
  SOLANA = 'solana',
}


@Entity()
export class PaymentData extends BaseEntities {

  @Column({
    type: 'enum',
    enum: PaymentMethodType,
  })
  methodType: PaymentMethodType;

  @Column({ nullable: true })
  stripeUserId?: string;

  @Column({ nullable: true })
  merchantCode?: string; // for Esewa

  @Column({ nullable: true })
  walletAddress?: string; // for Solana

  @ManyToOne(()=>Business,(business)=>business.paymentData)
  @JoinColumn({name:"business"})
  business:Business

}
