import { Entity, Column, OneToOne, JoinColumn} from 'typeorm';
import { BaseEntities } from './BaseEntities.entities';
import { Business } from './business.entities';

@Entity()
export class User extends BaseEntities {

  @Column({ unique: true })
  googleId: string; // Unique identifier from Google

  @Column()
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  profilePicture: string; // Optional field to store user's profile picture URL

  @OneToOne(() => Business, (business) => business.user,{eager:true})
  @JoinColumn()
  businesses: Business;
}
