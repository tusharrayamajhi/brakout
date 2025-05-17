import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { BaseEntities } from "./BaseEntities.entities";
import { Customer } from "./Customer.entities";
import { OrderItem } from "./OrderItem.entities";
import { Payment } from "./Payment.entities";
import { Business } from "./business.entities";
import { Shipping } from "./Shipping.entities";

@Entity()
export class Orders extends BaseEntities{

    @ManyToOne(() => Customer, (customer) => customer.orders, { onDelete: "CASCADE" })
    customer: Customer;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    total_amount: number;

    @OneToOne(() => Payment, (payment) => payment.order)
    @JoinColumn()
    payment: Payment;

    @Column({default:"pending"})
    status: string

    @OneToMany(()=>OrderItem,(item)=>item.order,{cascade:true,eager:true})
    orderItem:OrderItem[]

    @ManyToOne(()=>Business,(business)=>business.orders)
    @JoinColumn({name:"business"})
    business:Business

    @OneToMany(()=>Shipping,(shipping)=>shipping.order,{cascade:true})
    @JoinColumn({name:"shipping"})
    shipping:Shipping


}