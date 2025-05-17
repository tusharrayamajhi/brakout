import { IsNotEmpty, IsString } from "class-validator";


export class GoogleAuth{

    @IsNotEmpty()
    @IsString()
    credential:string
}