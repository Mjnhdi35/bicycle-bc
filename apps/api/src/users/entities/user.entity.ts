import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    @Index()
    accountId: string; // Substrate AccountId (SS58 format)

    @Column({ type: 'varchar', length: 32, nullable: true })
    username: string | null;

    @Column({ type: 'text', nullable: true })
    avatar: string | null; // URL or base64

    @Column({ type: 'text', nullable: true })
    bio: string | null;

    // Stats from blockchain
    @Column({ type: 'int', default: 0 })
    totalRaces: number;

    @Column({ type: 'int', default: 0 })
    wins: number;

    @Column({ type: 'bigint', default: 0 })
    totalDistance: string; // Use string for bigint

    @Column({ type: 'varchar', length: 255, default: '0' })
    totalRewards: string; // Use string for u128

    @Column({ type: 'bigint', nullable: true })
    createdAtBlock: number | null; // Block number when profile was created

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

