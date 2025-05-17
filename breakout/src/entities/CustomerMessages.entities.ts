import { Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import { BaseEntities } from "./BaseEntities.entities";
import { Customer } from "./Customer.entities";


@Entity()
export class CustomerMessages extends BaseEntities{

    @Column({nullable:true,})
    CustomerMessageId:string

    @Column({type:"text",nullable:true})
    CustomerMessage:string

    @ManyToOne(()=>Customer,customer=>customer.customerMessage)
    @JoinColumn({name:"customer"})
    customer:Customer

    @Column({type:"boolean",default:false})
    processed:boolean
}