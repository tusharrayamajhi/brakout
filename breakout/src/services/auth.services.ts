import { HttpException, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Business } from 'src/entities/business.entities';
import { Equal, Repository } from 'typeorm';
import { User } from 'src/entities/user.entities';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Request } from 'express';


@Injectable()
export class AuthService {
 
  private client: OAuth2Client;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(Business) private BusinessRepo: Repository<Business>,
    @InjectRepository(User) private UserRepo: Repository<User>,
    @Inject(CACHE_MANAGER) private readonly cacheManager:Cache
  ) {
    this.client = new OAuth2Client(configService.get('GOOGLE_CLIENT_ID'));
  }

  async validateGoogleToken(idToken: string) {
    try{

      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.configService.get('GOOGLE_CLIENT_ID'),
      });
      
      const payload = ticket.getPayload();
      if (!payload) throw new UnauthorizedException('Invalid Google token');
      
      
      const DBuser = await this.UserRepo.findOne({where:{googleId:payload.sub},relations:{businesses:true}})
      console.log(DBuser)
      if(DBuser){
      const user = {
        email: DBuser.email || '',
        name: DBuser.name || '',
        picture: DBuser.profilePicture || '',
        googleId: DBuser.googleId,
        business:DBuser.businesses
    };
      console.log("user exits")
      const token = this.jwtService.sign({
        sub: user.googleId,
        email: user.email
      });
      console.log(token)

      await this.cacheManager.set(`token:${token}`,token)
      // const cachetoken = await this.cacheManager.get(user.googleId)
      // console.log("cachetoken", cachetoken)
      
      return { token, user };
    }
    const users = this.UserRepo.create({email:payload.email,googleId:payload.sub,name:payload.name,profilePicture:payload.picture})
    const res = await this.UserRepo.save(users);
    if(!res){
      console.log("user not saved")
      return new HttpException("user not saved",HttpStatus.INTERNAL_SERVER_ERROR)
    }
    console.log("new user")
    
    // ✅ Check if user exists in DB (mocked)
    // await this.userService.findOrCreate(user);
    
    const user = {
      email: users.email || '',
      name: users.name || '',
      picture: users.profilePicture || '',
      googleId: users.googleId,
      business:users.businesses
  };
    const token = this.jwtService.sign({
      sub: user.googleId,
      email: user.email,
      
    });
      await this.cacheManager.set(`token:${token}`,token)
    
    return { token, user };
  }catch(err){
    console.log(err)
    return new HttpException("something went wrong",HttpStatus.INTERNAL_SERVER_ERROR)
  }
  }

  async logout(req:Request) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { message: 'No token provided.' };
    }

    const token = authHeader.split(' ')[1];

    // Optional: Check if token exists in cache before deleting
    const cached = await this.cacheManager.get(`token:${token}`);

    if (cached) {
      await this.cacheManager.del(`token:${token}`);
      console.log("logout from cacah")
      return { message: 'Logout successful. Token removed from cache.' };
    }
  console.log("logout from db")
    return { message: 'Logout successful. Please clear your token on the client.' };
  }

  async getProfile(req:Request) {
    try{
      interface users{
        sub:string,
        email:string
      }
      const user = req.user as users;
      if(!user) return new HttpException("user not found",HttpStatus.NOT_FOUND)
      const userProfile = await this.UserRepo.findOne({where:{googleId:Equal(user.sub)},relations:{businesses:true}})
    console.log(userProfile)
      return userProfile;
    }catch(err){
      console.log(err)
      return new HttpException("something went wrong",HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

}
