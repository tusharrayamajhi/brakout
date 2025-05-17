

import { Entity, Column, OneToMany, OneToOne } from 'typeorm';
import { BaseEntities } from './BaseEntities.entities';
import { SocialPage } from './socialmedia.entities';
import { User } from './user.entities';
import { Product } from './Product.entities';
import { PaymentData } from './paymentDetails';
import { Orders } from './Order.entities';
// import { User } from './User'; // If your business has multiple users

@Entity()
export class Business extends BaseEntities{


  @Column()
  name: string;  // Business name (Example: "ABC Corporation")

  @Column({ unique: true })
  email: string; // Business official email (unique)

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  logoUrl: string; // If business has a logo stored somewhere

  @Column({ default: true })
  isActive: boolean; // Active / Inactive status

  @Column({ nullable: true,type:"text" })
  description:string

//   Later Relations (if needed)
  @OneToMany(() => SocialPage, (socialPage) => socialPage.business)
  socialPages: SocialPage[];

  @OneToOne(() => User, (user) => user.businesses)
  user: User; 

  @OneToMany(() => Product, (product) => product.business)
  products: Product[];


  @OneToMany(() => PaymentData, (payment) => payment.business)
  paymentData: PaymentData[];

  @OneToMany(() => Orders, (order) => order.business)
  orders: Orders[];
}