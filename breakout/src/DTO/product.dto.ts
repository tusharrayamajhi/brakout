import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min, IsArray } from 'class-validator';

export enum Size {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
  FREE_SIZE = 'Free Size',
}

export enum Gender {
  MEN = 'Men',
  WOMEN = 'Women',
  UNISEX = 'Unisex',
  CHILDREN = 'Children',
}

export class ProductDto {
  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  price: string;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @IsOptional()
  @IsString()
  videoLink?: string;

  @IsString()
  @IsNotEmpty()
  color: string;

  @IsArray()
  @IsEnum(Size, { each: true })
  @IsNotEmpty()
  size: Size[];

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  season?: string;
}