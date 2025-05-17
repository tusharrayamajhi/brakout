import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectRepository } from "@nestjs/typeorm";
import { AttachmentType } from "src/entities/attachment.entities";
import { Business } from "src/entities/business.entities";
import { Customer } from "src/entities/Customer.entities";
import { SocialPage } from "src/entities/socialmedia.entities";
import { ModelService } from "src/services/mode.services";
import { OutputParserService } from "src/services/outputParser.services";
import { PromptServices } from "src/services/prompt.services";
import { ResponseServices } from "src/services/response.services";
import { Repository } from "typeorm";


@Injectable()
export class productSuggestionAgent {

    private readonly Model: ChatGoogleGenerativeAI
    private readonly prompt: ChatPromptTemplate
    private readonly outputParser: any

    constructor(
        private readonly modelService: ModelService,
        private readonly promptService: PromptServices,
        private readonly outputParserService: OutputParserService,
        private readonly responseService: ResponseServices,
        @InjectRepository(SocialPage) private readonly pageRepo: Repository<SocialPage>,
        @InjectRepository(Business) private readonly businessRepo: Repository<Business>,
    ) {
        this.Model = modelService.getModel()
        this.prompt = promptService.ProductAgentPrompt()
        this.outputParser = outputParserService.getProductAgentOutputParser()
    }


    @OnEvent('product_suggestion_agent')
    async messageAgent(data: {
        customerMessage: string, senderId: string, history: any, customerDetails: Customer, businessDetails: Business, pageId: string
    }) {
        const page = await this.pageRepo.findOne({ where: { pageId: data.pageId }, relations: { business: true } })
        if (!page) return
        const business = await this.businessRepo.findOne({ where: { id: page.business.id }, relations: { products: true } })
        if(!business) return
        const productAgent = this.prompt.pipe(this.Model).pipe(this.outputParser)
        const response: any = await productAgent.invoke({
            business: data.businessDetails,
            current_message: data.customerMessage,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            chat_history: data.history,
            customer_details: data.customerDetails,
            products: business.products,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            format_instructions: this.outputParser.getFormatInstructions()
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.log(response.suggestion)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if(response.response_type == "suggestion"){

            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (response.suggestion) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                for (const img of response.suggestion.images) {
                    console.log(img)
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    await this.responseService.sendAttachmentResponseToCustomer({pageId: data.pageId,senderId: data.senderId, attachment: { type: AttachmentType.IMAGE, payload: { url: img.imageUrl } } })
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                    await this.responseService.sendTextResponseToCustomer({pageId: data.pageId,senderId: data.senderId, textMessage: img.about_image })
                }
            }
        }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (response.suggestion.message) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                await this.responseService.sendTextResponseToCustomer({pageId: data.pageId, senderId: data.senderId, textMessage: response.suggestion.message })
            }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if(response.response_type == "question"){
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            await this.responseService.sendTextResponseToCustomer({pageId: data.pageId, senderId: data.senderId, textMessage: response.question })

        }


        console.log(response)

    }


}