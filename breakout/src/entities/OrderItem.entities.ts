import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Orders } from "./Order.entities";
import { Product } from "./Product.entities";
import { BaseEntities } from "./BaseEntities.entities";


@Entity()
export class OrderItem extends BaseEntities {

    @ManyToOne(() => Orders, (order) => order.id)
    order: Orders;

    @ManyToOne(() => Product, (product) => product.id,{eager:true})
    @JoinColumn({ name: 'productId' })
    product: Product;

    @Column()
    quantity: string;

    @Column("decimal")
    price: string; 

    @Column()
    size:string

    @Column()
    color:string

}