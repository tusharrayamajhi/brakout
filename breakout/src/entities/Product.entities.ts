import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntities } from './BaseEntities.entities';
import { Business } from './business.entities';

export enum Size {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
  FREE_SIZE = 'Free Size',
}

export enum Gender {
  MEN = 'Men',
  WOMEN = 'Women',
  UNISEX = 'Unisex',
  CHILDREN = 'Children',
}

@Entity()
export class Product extends BaseEntities {
  @Column({ nullable: false })
  productName: string;

  @Column({ type: 'text', nullable: false })
  description: string;

  @Column({ type: 'varchar', nullable: false, default: '0' })
  price: string;

  @Column({ type: 'int', unsigned: true, nullable: false })
  stock: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  imageUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  videoLink: string;

  @Column({ nullable: false })
  color: string;

  @Column({ type: 'simple-array', nullable: false })
  size: Size[];

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ nullable: true })
  season: string; // e.g., "Winter"

  @ManyToOne(() => Business, (business) => business.products)
  @JoinColumn({ name: 'business' })
  business: Business; // A product belongs to one business
}