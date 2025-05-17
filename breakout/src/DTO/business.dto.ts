import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';


export class BusinessDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsNotEmpty()
  @IsString()
  address?: string;

  @IsNotEmpty()
  @IsString()
  logoUrl?: string;

  @IsNotEmpty()
  @IsString()
  description:string

}