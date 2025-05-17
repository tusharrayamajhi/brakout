import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { BaseEntities } from "./BaseEntities.entities";
import { Customer } from "./Customer.entities";

@Entity()
export class AiMessages extends BaseEntities {
    @Column({ nullable: false })
    AiMessageId: string

    @Column({ type: "text" })
    AiMessage: string

    @ManyToOne(() => Customer, customer => customer.aiMessage)
    @JoinColumn({name:"customer"})
    customer: Customer


}