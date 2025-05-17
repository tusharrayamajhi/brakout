import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Equal } from 'typeorm';
import axios from 'axios';
import { PlatformType, SocialPage } from '../entities/socialmedia.entities';
import { User } from 'src/entities/user.entities';
import { Business } from 'src/entities/business.entities';

@Injectable()
export class FacebookService {
  
  private readonly logger = new Logger(FacebookService.name);

  constructor(
    @InjectRepository(SocialPage) private readonly facebookPageRepo: Repository<SocialPage>,
    @InjectRepository(User) private readonly UserRepo: Repository<User>,
    @InjectRepository(SocialPage) private readonly PageRepo: Repository<SocialPage>,
  ) {}

  async handleFacebookAccessToken(accessToken: string,req:any) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const user = await this.UserRepo.findOne({where:{googleId:req.user.sub},relations:{businesses:true}})
      if(!user) throw new Error("user not found")
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const pages = await this.fetchFacebookPages(accessToken);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if(!pages || pages.length === 0) throw new Error("no pages found")
      const savedPages = await this.savePages(pages,user.businesses);
      return { message: 'Pages fetched and saved', savedPages };
    } catch (err) {
      this.logger.error('Error in handleFacebookAccessToken:', err);
      throw err;
    }
  }

  private async fetchFacebookPages(userAccessToken: string) {
    try {
      const response = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
        params: {
          access_token: userAccessToken,
          fields: 'id,name,access_token,instagram_business_account',
        },
      });
      console.log("about page")
      console.log(response)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return response.data.data || [];
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('Fetch pages error:', err.response?.data || err.message);
      throw err;
    }
  }

  private async savePages(pages: any[],business:Business) {
    const savedPages: SocialPage[] = [];
  
    for (const page of pages) {
      
      // Check if Facebook page already exists
      const existingFbPage = await this.facebookPageRepo.findOne({
        where: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          pageId: page.id,
          platform: PlatformType.FACEBOOK
        },
      });
  
      if (!existingFbPage) {
        const fbPage = this.facebookPageRepo.create({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          pageId: page.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          pageName: page.name,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          accessToken: page.access_token,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          // username:page.username,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
          // profilePictureUrl:page.data.url,
          platform: PlatformType.FACEBOOK,
          isActive: true,
          business: business,
        });
  
        savedPages.push(await this.facebookPageRepo.save(fbPage));
      } else {
        savedPages.push(existingFbPage);
      }
  
      // ✅ Subscribe the page to your webhook
      try {
        await axios.post(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          `https://graph.facebook.com/v18.0/${page.id}/subscribed_apps`,
          {
            subscribed_fields: ['messages', 'message_reactions'],
          },
          {
            headers: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              Authorization: `Bearer ${page.access_token}`,
            },
          }
        );
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        console.log(`✅ Subscribed ${page.name} (${page.id}) to webhook`);
      } catch (err) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        console.error(`❌ Failed to subscribe ${page.name}:`, err?.response?.data || err);
      }
  
      // Handle Instagram if exists
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      if (page.instagram_business_account?.id) {
        const existingInstaPage = await this.facebookPageRepo.findOne({
          where: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            pageId: page.instagram_business_account.id,
            platform: PlatformType.INSTAGRAM,
          },
        });
  
        if (!existingInstaPage) {
          const instaPage = this.facebookPageRepo.create({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            pageId: page.instagram_business_account.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            pageName: `${page.name} (Instagram)`,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            accessToken: page.access_token,
            platform: PlatformType.INSTAGRAM,
            isActive: true,
            business: business,
          });
  
          savedPages.push(await this.facebookPageRepo.save(instaPage));
        } else {
          savedPages.push(existingInstaPage);
        }
      }
    }
  
    return savedPages;
  }


  async getPageDetails(req: any) {
    try{
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const user = await this.UserRepo.findOne({where:{googleId:req.user.sub},relations:{businesses:true}})
      console.log(user)
      if(!user) throw new Error("user not found")
      const pages = await this.PageRepo.find({where:{business:Equal(user.businesses.id)}})
      return pages

    }catch(err){
      console.log(err)
      return new HttpException("something went wrong",HttpStatus.INTERNAL_SERVER_ERROR)

    }
  }
}