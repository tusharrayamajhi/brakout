import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AiMessages } from "src/entities/AiMessages.entities";
import { Attachments } from "src/entities/attachment.entities";
import { Customer } from "src/entities/Customer.entities";
import { CustomerMessages } from "src/entities/CustomerMessages.entities";
import { SocialPage } from "src/entities/socialmedia.entities";
import { Equal, Repository } from "typeorm";


@Injectable()
export class MessageServices{

    constructor(
        @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
        @InjectRepository(CustomerMessages) private readonly customerMessageRepo: Repository<CustomerMessages>,
        @InjectRepository(AiMessages) private readonly aiMessageRepo: Repository<AiMessages>,
        @InjectRepository(Attachments) private readonly attachmentRepo: Repository<Attachments>,
        @InjectRepository(SocialPage) private readonly pageRepo: Repository<SocialPage>,
    ){}




    async getHistoryMessage(data:{senderId:string}){
        try{
            const customer = await this.customerRepo.findOne({where:{ id: data.senderId}});
        if (!customer) {
            console.log("customer not found");
            console.log("stop calling llm");
            return JSON.stringify({ message: "customer not found" });
        }
        const messages = await this.customerMessageRepo.find({ where: { customer: Equal(customer.id), processed: true } });
        const aiMessages = await this.aiMessageRepo.find({ where: { customer: Equal(data.senderId) } });
        const image = await this.attachmentRepo.find({where:{customerId:customer.id}})
        // Convert messages to a common format
        const customerMessageObjects = messages.map(m => ({
            type: 'customer',
            content: m.CustomerMessage,
            createdAt: m.createdAt
        }));
        
        const aiMessageObjects = aiMessages.map(m => ({
            type: 'ai',
            content: m.AiMessage,
            createdAt: m.createdAt
        }));
        const attachmentObjects = image.map(a => ({
            type: 'attachment',
            content: `${a.payload.url}`,
            createdAt: a.createdAt
        }));
        
        const allMessages = [...customerMessageObjects, ...aiMessageObjects,...attachmentObjects];
        
        // Sort messages by creation date
        allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        
        
        if (allMessages.length === 0) {
            return { data: [] };
        }
        
        // Convert to LangChain messages
        const langchainMessages = allMessages.map(msg => {
            if (msg.type === 'customer') {
                // return msg.content;
                return new HumanMessage(msg.content);
            } else if (msg.type === 'ai') {
                return new AIMessage(msg.content);
            } else {
                // Treat attachments as system messages or custom entries
                return new AIMessage(msg.content);
            }
        });
        return {data:langchainMessages};
        
    }catch(err){
            console.log(err)
            console.log("something went wrong")
        }

    }

    async saveMessage(data:{message:{mid:string,text:string},senderId:string}){
        try{

            const message = data.message;
            const customer = await this.customerRepo.findOne({where:{id:data.senderId}});
            if(!customer){
                console.log("customer not found");
                console.log("stop calling llm");
                return;
            }

            let text:string = "";
        if(message.text){
            text = message.text
        }
            
            const response = this.customerMessageRepo.create({
                CustomerMessageId:message.mid,
                customer: customer,
                CustomerMessage:text,
                // attachments:attachmentsData,
                processed:true,
                // reply_to:replyTo
            })
            await this.customerMessageRepo.save(response);
            return {message:"saved successfully"}
        }catch(err:any){
            console.log(err)
        }
        }




}