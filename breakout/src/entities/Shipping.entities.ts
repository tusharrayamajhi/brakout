import { Entity, Column, ManyToOne } from "typeorm";
import { Orders } from "./Order.entities";
import { BaseEntities } from "./BaseEntities.entities";

@Entity()
export class Shipping  extends BaseEntities {

    @ManyToOne(() => Orders, (order) => order.id)
    order: Orders;

    @Column("text")
    shippingAddress: string;

    @Column()
    email:string

    @Column()
    phone:string
}
