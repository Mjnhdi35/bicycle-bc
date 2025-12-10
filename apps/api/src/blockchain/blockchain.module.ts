import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BlockchainService } from './blockchain.service';
import { BlockchainController } from './blockchain.controller';
import { EventProcessor } from './event-processor';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: 'blockchain-events',
        }),
        UsersModule,
    ],
    controllers: [BlockchainController],
    providers: [BlockchainService, EventProcessor],
    exports: [BlockchainService],
})
export class BlockchainModule { }

