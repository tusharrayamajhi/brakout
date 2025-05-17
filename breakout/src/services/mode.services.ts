import { ChatGoogleGenerativeAI} from "@langchain/google-genai";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";


@Injectable()
export class ModelService{

    private readonly model:ChatGoogleGenerativeAI;
    
    constructor(
        private readonly config:ConfigService
    ){
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const apiKey = this.config.get("GOOGLE_API_KEY");
        if(!apiKey){
            console.log("no api key found");
        }
        this.model = new ChatGoogleGenerativeAI({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            apiKey:apiKey,
            temperature:0.2,
            model:"gemini-1.5-flash",
        });
    }

    getModel():ChatGoogleGenerativeAI{
        return this.model
    }


}