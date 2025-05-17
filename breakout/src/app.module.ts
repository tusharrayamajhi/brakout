import { Module } from '@nestjs/common';
import {ConfigModule,ConfigService} from "@nestjs/config"
import {TypeOrmModule} from "@nestjs/typeorm"
import { Customer } from './entities/Customer.entities';
import { AiMessages } from './entities/AiMessages.entities';
import { CustomerMessages } from './entities/CustomerMessages.entities';
import { Orders } from './entities/Order.entities';
import { OrderItem } from './entities/OrderItem.entities';
import { Payment } from './entities/Payment.entities';
import { Product } from './entities/Product.entities';
import { Shipping } from './entities/Shipping.entities';
import { Attachments } from './entities/attachment.entities';
import { Payload } from './entities/payload.entities';
import { AuthController } from './auth/google.auth';
import { JwtModule } from '@nestjs/jwt';
import { AuthTokenGuard } from './guards/JwtStrategy.guards';
import { AuthService } from './services/auth.services';
import { Business } from './entities/business.entities';
import { User } from './entities/user.entities';
import { SocialPage } from './entities/socialmedia.entities';
import { FacebookService } from './services/facebook.services';
import { FacebookController } from './auth/facebook.auth';
import { customerService } from './services/customer.services';
import { MessageServices } from './services/message.services';
import { CacheModule } from '@nestjs/cache-manager';
import {EventEmitterModule} from "@nestjs/event-emitter"
import { BusinessController } from './controllers/business.controllers';
import { BusinessService } from './services/business.services';
import { N8NController } from './controllers/n8n';
import { StripeService } from './services/stripe.services';
import { ProductController } from './controllers/product.controllers';
import { ProductService } from './services/product.services';
import { CustomerController } from './controllers/customer.controllers';
import { PaymentData } from './entities/paymentDetails';
import { PaymentDataController } from './controllers/paymentConnect.controllers';
import { PaymentConnectService } from './services/paymentconnect';
import { OrdersController } from './controllers/order.controllers';
import { OrdersService } from './services/order.services';
import { SolanaPayController } from './controllers/solana.controllers';
import { SolanaPayService } from './services/solana.services';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal:true}),
    TypeOrmModule.forRootAsync({
      useFactory:(configService:ConfigService)=>({
        type:"mysql",
        database:configService.get("DB_DATABASE"),
        password:configService.get("DB_PASSWORD"),
        username:configService.get("DB_USERNAME"),        
        host:configService.get("DB_HOST"),
        port:+configService.get("DB_PORT"),
        entities:[
          Customer,
          AiMessages,
          CustomerMessages,
          Orders,
          OrderItem,
          Payment,
          Product,
          Shipping,
          Attachments,
          Payload,
          Business,
          SocialPage,
          User,
          PaymentData
        ],
        synchronize:true
      }),
      inject:[ConfigService]
    }),
    TypeOrmModule.forFeature([
      Customer,
      Attachments,
      CustomerMessages,
      AiMessages,
      Product,
      Payment,
      Shipping,
      OrderItem,
      Orders,
      Payload,
      Business,
      User,
      SocialPage,
      PaymentData
    ]),
    CacheModule.register({isGlobal:true}),
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot(),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),

  ],
  controllers: [AuthController,PaymentDataController,N8NController,SolanaPayController,CustomerController,FacebookController,BusinessController,ProductController,OrdersController],
  providers: [AuthTokenGuard,SolanaPayService,OrdersService,PaymentConnectService,ProductService,StripeService,BusinessService,MessageServices,AuthService,FacebookService,customerService],
})
export class AppModule {}
