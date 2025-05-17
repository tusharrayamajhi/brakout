import { customerService } from './../services/customer.services';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/entities/Customer.entities';
import { CustomerMessages } from 'src/entities/CustomerMessages.entities';
import { Product } from 'src/entities/Product.entities';
import { Orders } from 'src/entities/Order.entities';
import { Repository, Equal } from 'typeorm';
import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { Message, WebhookEvent } from 'src/meta';
import { SocialPage } from 'src/entities/socialmedia.entities';
import { ResponseServices } from 'src/services/response.services';
import { MessageServices } from 'src/services/message.services';
import { Business } from 'src/entities/business.entities';
import { SuperAgent } from 'src/agent/super.agent';
import {EventEmitter2} from "@nestjs/event-emitter"

@Controller()
export class WebhookController {

  private MessageTimer:Map<string,NodeJS.Timeout> = new Map();
  

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Customer) private readonly customerRepo: Repository<Customer>,
    @InjectRepository(CustomerMessages) private readonly customerMessageRepo: Repository<CustomerMessages>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Orders) private readonly orderRepo: Repository<Orders>,
    @InjectRepository(SocialPage) private readonly pageRepo: Repository<SocialPage>,
    @InjectRepository(Business) private readonly businessRepo: Repository<Business>,
    private readonly customerService:customerService,
    private readonly responseService:ResponseServices,
    private readonly messageServices:MessageServices,
    private readonly superAgent:SuperAgent,
    private readonly eventEmitter:EventEmitter2
  ) {

  }




  @Get("/webhook")
  getWebhook(@Res() res: Response, @Query('hub.mode') mode: string, @Query('hub.verify_token') token: string, @Query('hub.challenge') challenge: string) {
    try{

      // Check if a token and mode is in the query string of the request
      console.log(this.config.get("META_verifyToken"))
      if (mode && token) {
        // Check the mode and token sent is correct
        if (mode === "subscribe" && token === this.config.get("META_verifyToken")) {
          // Respond with the challenge token from the request
          console.log("WEBHOOK_VERIFIED");
          res.status(200).send(challenge);
        } else {
          // Respond with '403 Forbidden' if verify tokens do not match
          res.sendStatus(403);
        }
      }
    }catch(err){
      console.log(err)
    }

  }


  @Post("/webhook")
  async postWebhook(@Req() req: Request, @Res() res: Response, @Body() body: WebhookEvent) {
  
    if (body.object === "page") {
      for (const entry of body.entry) {
        for (const message of entry.messaging) {
        // const webhookEvent = entry.messaging[0];
        const senderPsid = message.sender.id;

        const socialPage = await this.pageRepo.findOne({where:{pageId:entry.id}})
        if(!socialPage) return
        const customer = await this.customerRepo.findOneBy({ id: senderPsid,socialPage:Equal(socialPage.id)})
        if (!customer) {
          try {
            const customer = await this.customerService.GetUserData(entry.id,senderPsid)
            if (customer) {
              await this.customerService.SaveCustomer(entry.id,customer)
            }
          } catch (err) {
            console.log(err)
          }
        }


        if (message.message) {
          try {

              // await this.llmEvent.handelMessage(senderPsid);
              const customerMessage:Message = message.message;
              const [history,customerDetails,businessDetails] = await Promise.all([
                  this.messageServices.getHistoryMessage({senderId:senderPsid}),
                  this.customerRepo.findOne({where:{id:senderPsid}}),
                  this.pageRepo.findOne({where:{pageId:Equal(entry.id)},relations:{business:true}}).then(res=>res?.business)
              ])
              await this.messageServices.saveMessage({message:{mid:customerMessage.mid,text:customerMessage.text || ''},senderId:senderPsid});
              
              const superAgentResponse:any = await this.superAgent.superAgent({history:history,customer:customerDetails,business:businessDetails,message:message.message.text})

              console.log(superAgentResponse)
              for(const agent of superAgentResponse){
                  // console.log(agent.agent)
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
                  this.eventEmitter.emit(agent.agent_name, {
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                      customerMessage: agent.customerMessage,
                      senderId: senderPsid,
                      history: history,
                      customerDetails: customerDetails,
                      businessDetails: businessDetails,
                      pageId:entry.id
                  });
                  console.log("loop")
              }


              // const [message,product] = await Promise.all([
              //     await this.messageAgent.Message({message:customerMessage.text,customer:cus, history:histroy,senderId:senderPsid,time:new Date(),business:business,tone:intent?.tone,confidence:intent?.confidence}),
              //     await this.productAgent.Product({business:business,customer:cus,history:histroy,message:customerMessage?.text,product:products,time:new Date(),confident:intent?.confidence,tone:intent?.tone})
              // ]);
              // console.log(message)
              // console.log(product)

              // this.eventEmitter.emit('message', { payload: webhookEvent.message, senderId: senderPsid });

              // if (this.MessageTimer.has(senderPsid)) {
              //     clearTimeout(this.MessageTimer.get(senderPsid))
              // }

              // const timer = setTimeout(() => {
              //     this.MessageTimer.delete(senderPsid)
              //     this.eventEmitter.emit('llm', senderPsid);
              // }, 0)
              // this.MessageTimer.set(senderPsid, timer)
              // console.log("send event")
          } catch (err) {
              console.log(err)
          }
        }
      }

      };


      res.status(200).send("EVENT_RECEIVED");

      // console.log(req)
    } else {
      res.sendStatus(404);
    }
  }

}
