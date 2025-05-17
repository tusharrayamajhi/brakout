import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Business } from "src/entities/business.entities";
import { Customer } from "src/entities/Customer.entities";
import { ModelService } from "src/services/mode.services";
import { OutputParserService } from "src/services/outputParser.services";
import { PromptServices } from "src/services/prompt.services";
import { ResponseServices } from "src/services/response.services";


@Injectable()
export class GeneralMessageEvent{

    private readonly Model:ChatGoogleGenerativeAI
    private readonly prompt:ChatPromptTemplate
    private readonly outputParser:any

    constructor(
        private readonly modelService:ModelService,
        private readonly promptService:PromptServices,
        private readonly outputParserService:OutputParserService,
        private readonly responseService:ResponseServices
    ){
        this.Model = modelService.getModel()
        this.prompt = promptService.getGeneraMessagePrompt()
        this.outputParser = outputParserService.getMessageOutputParser()
    }


    @OnEvent('general_message_agent')
    async messageAgent(data:{customerMessage: string,senderId: string,history: any,customerDetails: Customer,businessDetails: Business,pageId:string
    }){
        const messageAgent = this.prompt.pipe(this.Model).pipe(this.outputParser)
        const response:any = await messageAgent.invoke({
            business:data.businessDetails,
            current_message:data.customerMessage,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            chat_history:data.history,
            customer_details:data.customerDetails,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            format_instructions:this.outputParser.getFormatInstructions()
        })
        for(const res of response){
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            await this.responseService.sendTextResponseToCustomer({pageId:data.pageId,senderId:data.senderId,textMessage:res.message})
        }
        console.log(response)
        
    }


}