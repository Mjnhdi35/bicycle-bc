import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { EventRecord } from '@polkadot/types/interfaces';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BlockchainService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(BlockchainService.name);
    private api: ApiPromise | null = null;
    private unsubscribe: (() => void) | null = null;

    constructor(
        @InjectQueue('blockchain-events') private eventQueue: Queue,
        private configService: ConfigService,
    ) { }

    async onModuleInit() {
        const wsUrl = this.configService.get<string>('SUBSTRATE_WS_URL');
        if (!wsUrl) {
            throw new Error('SUBSTRATE_WS_URL environment variable is required');
        }

        this.logger.log(`Connecting to Substrate node at ${wsUrl}`);

        try {
            const provider = new WsProvider(wsUrl);
            this.api = await ApiPromise.create({ provider });

            this.logger.log('Connected to Substrate node');

            // Subscribe to new blocks
            await this.subscribeToBlocks();
        } catch (error) {
            this.logger.error('Failed to connect to Substrate node', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        if (this.api) {
            await this.api.disconnect();
            this.api = null;
        }
    }

    private async subscribeToBlocks() {
        if (!this.api) {
            throw new Error('API not initialized');
        }

        // Subscribe to new blocks
        this.unsubscribe = await this.api.rpc.chain.subscribeNewHeads(async (header) => {
            const blockNumber = header.number.toNumber();
            this.logger.debug(`New block: #${blockNumber}`);

            try {
                // Get block hash
                const blockHash = header.hash;

                // Get block with events
                const signedBlock = await this.api!.rpc.chain.getBlock(blockHash);
                const events = await this.api!.query.system.events.at(blockHash);

                // Convert Vec<EventRecord> to array
                // events is a Vec<EventRecord> which implements Codec and is iterable
                const eventsArray: EventRecord[] = Array.from(events as unknown as EventRecord[]);

                // Process events
                await this.processBlockEvents(blockNumber, blockHash.toString(), eventsArray);
            } catch (error) {
                this.logger.error(`Error processing block #${blockNumber}`, error);
            }
        });
    }

    private async processBlockEvents(
        blockNumber: number,
        blockHash: string,
        events: EventRecord[],
    ) {
        for (const record of events) {
            const { event } = record;

            // Convert event.data to JSON format for queue serialization
            // event.data is a Codec object, we need to convert it to plain JSON
            const dataJson = event.data.toJSON() as any;

            const eventData = {
                blockNumber,
                blockHash,
                pallet: event.section,
                method: event.method,
                data: dataJson,
            };

            // Only process userProfile events
            if (event.section === 'userProfile') {
                this.logger.log(
                    `UserProfile event: ${event.method} at block #${blockNumber}`,
                );
                this.logger.debug(`Event data: ${JSON.stringify(dataJson)}`);

                // Add to queue for async processing
                await this.eventQueue.add('userProfile-event', eventData, {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                });
            }
        }
    }

    getApi(): ApiPromise {
        if (!this.api) {
            throw new Error('API not initialized');
        }
        return this.api;
    }
}

