import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';

interface UserProfileEvent {
    blockNumber: number;
    blockHash: string;
    pallet: string;
    method: string;
    data: any;
}

@Processor('blockchain-events')
@Injectable()
export class EventProcessor {
    private readonly logger = new Logger(EventProcessor.name);

    constructor(private usersService: UsersService) { }

    @Process('userProfile-event')
    async handleUserProfileEvent(job: Job<UserProfileEvent>) {
        const { blockNumber, blockHash, method, data } = job.data;

        this.logger.log(
            `Processing UserProfile event: ${method} at block #${blockNumber}`,
        );
        this.logger.debug(`Event data received: ${JSON.stringify(data)}`);

        try {
            switch (method) {
                case 'UsernameSet':
                    await this.handleUsernameSet(data, blockNumber);
                    break;

                case 'ProfileUpdated':
                    await this.handleProfileUpdated(data, blockNumber);
                    break;

                case 'StatsUpdated':
                    await this.handleStatsUpdated(data, blockNumber);
                    break;

                default:
                    this.logger.warn(`Unknown UserProfile event method: ${method}`);
            }
        } catch (error) {
            this.logger.error(
                `Error processing UserProfile event ${method}`,
                error,
            );
            throw error; // Retry job
        }
    }

    private async handleUsernameSet(data: any, blockNumber: number) {
        // Extract account and username from event data
        // data is already JSON format from blockchain.service.ts
        // Event format from Rust: Event::UsernameSet { account, username }
        // When serialized to JSON, it can be:
        // - Object: { account: "...", username: [...] }
        // - Array: [account, username] (if using tuple format)

        this.logger.debug(`handleUsernameSet - data type: ${typeof data}, isArray: ${Array.isArray(data)}`);
        this.logger.debug(`handleUsernameSet - data keys: ${Object.keys(data || {})}`);

        // Try object format first (named fields)
        let accountId = data.account;
        let usernameBytes = data.username;

        // If not found, try array format (tuple)
        if (!accountId && Array.isArray(data)) {
            accountId = data[0];
            usernameBytes = data[1];
        }

        // If still not found, try indexed access
        if (!accountId) {
            accountId = data[0];
        }
        if (!usernameBytes && data[1] !== undefined) {
            usernameBytes = data[1];
        }

        // Helper function to decode bytes and truncate to 32 chars
        const decodeAndTruncate = (bytes: any, maxLength: number = 32): string | null => {
            if (!bytes) return null;

            let decoded: string | null = null;

            if (typeof bytes === 'string') {
                // Check if it's a hex string (0x...)
                if (bytes.startsWith('0x')) {
                    // Remove '0x' prefix and decode hex
                    const hex = bytes.slice(2);
                    decoded = Buffer.from(hex, 'hex').toString('utf-8').replace(/\0/g, '');
                } else {
                    decoded = bytes;
                }
            } else if (Array.isArray(bytes)) {
                // Uint8Array serialized as array
                decoded = Buffer.from(bytes).toString('utf-8').replace(/\0/g, '');
            } else if (bytes.toU8a && typeof bytes.toU8a === 'function') {
                // Still a Codec object
                decoded = Buffer.from(bytes.toU8a()).toString('utf-8').replace(/\0/g, '');
            }

            // Truncate to maxLength if needed
            if (decoded && decoded.length > maxLength) {
                decoded = decoded.substring(0, maxLength);
            }

            return decoded;
        };

        const username = decodeAndTruncate(usernameBytes, 32);

        if (!accountId) {
            throw new Error('AccountId not found in UsernameSet event');
        }

        this.logger.log(`UsernameSet: ${accountId} -> ${username}`);

        // Find or create user
        let user = await this.usersService.findByAccountId(accountId);

        if (user) {
            // Update existing user
            await this.usersService.update(user.id, {
                username: username || undefined,
                createdAtBlock: blockNumber,
            });
        } else {
            // Create new user
            await this.usersService.create({
                accountId,
                username: username || undefined,
            });
        }
    }

    private async handleProfileUpdated(data: any, blockNumber: number) {
        const accountId = data.account || data[0];
        const usernameBytes = data.username || data[1];
        const avatarBytes = data.avatar || data[2];
        const bioBytes = data.bio || data[3];

        // Helper function to decode bytes
        const decodeBytes = (bytes: any, maxLength?: number): string | null => {
            if (!bytes) return null;

            let decoded: string | null = null;

            if (typeof bytes === 'string') {
                // Check if it's a hex string (0x...)
                if (bytes.startsWith('0x')) {
                    // Remove '0x' prefix and decode hex
                    const hex = bytes.slice(2);
                    decoded = Buffer.from(hex, 'hex').toString('utf-8').replace(/\0/g, '');
                } else {
                    decoded = bytes;
                }
            } else if (Array.isArray(bytes)) {
                decoded = Buffer.from(bytes).toString('utf-8').replace(/\0/g, '');
            } else if (bytes.toU8a && typeof bytes.toU8a === 'function') {
                decoded = Buffer.from(bytes.toU8a()).toString('utf-8').replace(/\0/g, '');
            }

            // Truncate if maxLength specified
            if (decoded && maxLength && decoded.length > maxLength) {
                decoded = decoded.substring(0, maxLength);
            }

            return decoded;
        };

        const username = decodeBytes(usernameBytes, 32); // Username max 32 chars
        const avatar = decodeBytes(avatarBytes); // Avatar can be longer (text field)
        const bio = decodeBytes(bioBytes); // Bio can be longer (text field)

        if (!accountId) {
            throw new Error('AccountId not found in ProfileUpdated event');
        }

        this.logger.log(`ProfileUpdated: ${accountId}`);

        let user = await this.usersService.findByAccountId(accountId);

        if (user) {
            await this.usersService.update(user.id, {
                username: username || undefined,
                avatar: avatar || undefined,
                bio: bio || undefined,
            });
        } else {
            await this.usersService.create({
                accountId,
                username: username || undefined,
                avatar: avatar || undefined,
                bio: bio || undefined,
            });
        }
    }

    private async handleStatsUpdated(data: any, blockNumber: number) {
        const accountId = data.account?.toString() || data[0]?.toString();
        const totalRaces = data.totalRaces?.toNumber() || data[1]?.toNumber();
        const wins = data.wins?.toNumber() || data[2]?.toNumber();
        const totalDistance = data.totalDistance?.toString() || data[3]?.toString();
        const totalRewards = data.totalRewards?.toString() || data[4]?.toString();

        if (!accountId) {
            throw new Error('AccountId not found in StatsUpdated event');
        }

        this.logger.log(`StatsUpdated: ${accountId}`);

        let user = await this.usersService.findByAccountId(accountId);

        if (user) {
            await this.usersService.update(user.id, {
                totalRaces,
                wins,
                totalDistance,
                totalRewards,
            });
        } else {
            // Create user with stats
            await this.usersService.create({
                accountId,
                totalRaces,
                wins,
                totalDistance,
                totalRewards,
            });
        }
    }
}

