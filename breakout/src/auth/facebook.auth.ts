import { Body, Controller, Post, Req, UseGuards, BadRequestException, Get } from '@nestjs/common';
import { Request } from 'express';
import { AuthTokenGuard } from 'src/guards/JwtStrategy.guards';
import { FacebookService } from 'src/services/facebook.services';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Controller('auth/facebook')
export class FacebookController {
  constructor(
    private readonly facebookService: FacebookService,
    private readonly config:ConfigService,
  ) {}

  @Post()
  @UseGuards(AuthTokenGuard)
  async handleAccessToken( @Body() body: { code: string; redirectUri: string },@Req() req: Request) {
    const { code, redirectUri } = body;
    const FB_APP_ID = String(await this.config.get("FACEBOOK_APP_ID"));
    const FB_APP_SECRET = String(await this.config.get("FACEBOOK_APP_SECRET"));

    try {
      const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`;

      const response:any = await axios.get(tokenUrl);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const { access_token } = response.data;

      if (!access_token) {
        throw new Error('No access token received from Facebook.');
      }

      // Pass access token to service
      return this.facebookService.handleFacebookAccessToken(access_token, req);
    } catch (error: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.error('Facebook Access Token Error:', error?.response?.data || error.message);
      throw new BadRequestException(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        error?.response?.data?.error?.message || 'Failed to get Facebook access token'
      );
    }
  }

  @Get("fb-page")
  @UseGuards(AuthTokenGuard)
  async getFbPage(@Req() req:Request){
    return await this.facebookService.getPageDetails(req)
  }
}
