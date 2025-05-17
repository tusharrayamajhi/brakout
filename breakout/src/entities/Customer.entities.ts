import { Column, CreateDateColumn, DeleteDateColumn, Entity, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from "typeorm";
import { CustomerMessages } from "./CustomerMessages.entities";
import { AiMessages } from "./AiMessages.entities";
import { Orders } from "./Order.entities";
import { SocialPage } from "./socialmedia.entities";


@Entity()
export class Customer {
    @PrimaryColumn()
    id: string

    @DeleteDateColumn()
    deletedAt: string

    @CreateDateColumn()
    createdAt: string

    @UpdateDateColumn()
    updatedAt: string


    @Column()
    fullName: string

    @Column()
    email: string

    @OneToMany(() => CustomerMessages, customerMessages => customerMessages.customer)
    customerMessage: CustomerMessages[]

    @OneToMany(() => AiMessages, aiMessage => aiMessage.customer)
    aiMessage: AiMessages[]

    @OneToMany(() => Orders, (order) => order.customer)
    orders: Orders[];

    @ManyToOne(() => SocialPage, (socialPage) => socialPage.customers)
    socialPage: SocialPage;


}