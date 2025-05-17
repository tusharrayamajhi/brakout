

import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Business } from './business.entities';
import { Customer } from './Customer.entities';
import { BaseEntities } from './BaseEntities.entities';

export enum PlatformType {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  WHATSAPP = 'whatsapp',
  TIKTOK = 'tiktok', // you can add more if needed
}

@Entity()
export class SocialPage extends BaseEntities {

  @Column({
    type: 'enum',
    enum: PlatformType,
  })
  platform: PlatformType;  // facebook / instagram / etc.

  @Column()
  pageId: string;  // Page ID from Facebook or Instagram

  @Column()
  pageName: string;  // Display name of the page

  @Column('text')
  accessToken: string; // Access token to call APIs

  @Column({ nullable: true })
  username: string;  // Instagram username or Facebook page username

  @Column({ nullable: true })
  profilePictureUrl: string; // Page profile picture URL

  @Column({ default: true })
  isActive: boolean; // Whether connection is active

  @ManyToOne(() => Business, (business) => business.socialPages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business' })
  business: Business;

  @OneToMany(() => Customer, (customer) => customer.socialPage)
  customers: Customer[];
}
