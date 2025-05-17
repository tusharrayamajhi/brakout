import { Entity, Column, OneToOne, PrimaryGeneratedColumn, DeleteDateColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Orders } from "./Order.entities";
import { BaseEntities } from "./BaseEntities.entities";

export enum PaymentStatus {
  SUCCESS = "success",
  FAILED = "failed",
  PENDING = "pending",
}

export enum PaymentMethod {
  STRIPE = "stripe",
  ESEWA = "esewa",
  SOLANA = "solana",
}

@Entity()
export class Payment {
  @PrimaryGeneratedColumn("increment")
  id: string

  @DeleteDateColumn()
  deletedAt: string

  @CreateDateColumn()
  createdAt: string

  @UpdateDateColumn()
  updatedAt: string

  @OneToOne(() => Orders)
  order: Orders;

  @Column({ nullable: false, type:"text"})
  transaction_uuid: string; // Your UUID or provider’s transaction ID

  @Column({ type: "enum", enum: PaymentMethod })
  payment_method: PaymentMethod;

  @Column({ nullable: true })
  email: string; // Email used in Stripe checkout, etc.

  @Column("json", { nullable: true })
  raw_response?: any; // For debugging or refunds
}
