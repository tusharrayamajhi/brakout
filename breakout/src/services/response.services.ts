import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import { AiMessages } from "src/entities/AiMessages.entities";
import { Attachments, AttachmentType } from "src/entities/attachment.entities";
import { Customer } from "src/entities/Customer.entities";
import { Payload } from "src/entities/payload.entities";
import { SocialPage } from "src/entities/socialmedia.entities";
import { Equal, Repository } from "typeorm";

@Injectable()
export class ResponseServices{
    constructor(
        @InjectRepository(Customer) private customerRepo: Repository<Customer>,
        @InjectRepository(AiMessages) private aiMessageRepo: Repository<AiMessages>,
        @InjectRepository(Attachments) private attachmentRepo: Repository<Attachments>,
        @InjectRepository(Payload) private payloadRepo: Repository<Payload>,    
        @InjectRepository(SocialPage) private socialPageRepo: Repository<SocialPage>,    
        private configService: ConfigService
    ){}

    async sendTextResponseToCustomer(data:{senderId: string,textMessage: string,pageId:string}){
    
        try {
            if (!data.senderId) {
                console.log("No sender ID");
                return { message: "empty senderId" };
            }
            // if(!data.pageId){
            //     console.log("No page ID");
            //     return { message: "empty pageId" };
            // }
            const socialPage = await this.socialPageRepo.findOneBy({ pageId: data.pageId });
            if(!socialPage){
                console.log("page not found")
                return
            }
            const customer = await this.customerRepo.findOneBy({ id: data.senderId,socialPage:Equal(socialPage.id) });
    
            if (!customer) {
                console.log("Customer not found");
                return { message: "invalid sender id" };
            }
    
            if (!data.textMessage) {
                console.log("No text message");
                return { message: "empty textMessage" };
            }
    
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            // const token = this.configService.get("MESSANGER_API");
            if (!socialPage.accessToken) {
                console.log("Token not found");
                return { message: "api token is empty" };
            }
    
            const response = await axios.post(
                `https://graph.facebook.com/v21.0/me/messages`,
                {
                    message: { text: data.textMessage },
                    recipient: { id: data.senderId }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${socialPage.accessToken}`
                    }
                }
            );
    
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const result =  response.data;
    
            if (result) {
                const aiMsg = this.aiMessageRepo.create({
                    AiMessage: data.textMessage,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    AiMessageId: result.message_id
                });
    
                try {
                    await this.aiMessageRepo.save({ ...aiMsg, customer });
                } catch (err) {
                    console.log("Failed to save message:", err);
                    return { message: "failed to save data in database"+ err };
                }
            }
    
            if (response.status) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                return { message: "successfully sent message", data: data };
            }
        } catch (err) {
            console.log("Error while sending message:", err);
            return { message: "error while sending message" + err };
        }
    }


    async sendAttachmentResponseToCustomer(
        data:{
        pageId:string,
        senderId: string,
        attachment: {
            type: AttachmentType,
            payload: {
                url: string
            }
        }
    }
    ){
        console.log(data)
        try {
            if (!data.senderId) {
                return { message: "empty senderId" };
            }
    
            if (!data.attachment) {
                return { message: "empty attachment" };
            }
    
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            // const token = this.configService.get("MESSANGER_API");
            const page = await this.socialPageRepo.findOne({where:{pageId:data.pageId}})
            if(!page){
                console.log("page not found")
                return;
            }
            if (!page.accessToken) {
                return { message: "api token is empty" };
            }
    
            const response:any = await axios.post(
                `https://graph.facebook.com/v21.0/me/messages` ,
                {
                    message: {
                        attachment: {
                            type: data.attachment.type,
                            payload: {
                                url: data.attachment.payload.url
                            }
                        }
                    },
                    recipient: {
                        id: data.senderId
                    }
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${page.accessToken}`
                    }
                }
            );
            
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const responseData = response.data as {message_id:string,recipient_id:string}
            const payload = this.payloadRepo.create({ url: data.attachment.payload.url });
            const attach = this.attachmentRepo.create({
                type: data.attachment.type,
                payload: payload,
                customerId: data.senderId,
            });
            
            const result = await this.attachmentRepo.save(attach);
            console.log("Attachment saved:", result,responseData);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        } catch (err) {
            console.log(err)
            console.log("Error while sending attachment:"+ err);
            return { message: "error while sending attachment" + err };
        }
    }

    
    async sendPaymentLink(data:{senderId:string,link:string,pageId:string}){
        await axios.post(
            `https://graph.facebook.com/v21.0/me/messages`,
            {
                recipient: {
                    id: data.senderId
                },
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "button",
                            text: "pay with sui",
                            buttons: [
                                {
                                    type: "web_url",
                                    url: data.link,
                                    title: "pay with sui"
                                }
                            ]
                        }
                    }
                }
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.configService.get('MESSANGER_API')}`
                }
            }
        );
        
    }


}