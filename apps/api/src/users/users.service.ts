import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<User> {
        // Check if user with this accountId already exists
        const existingUser = await this.usersRepository.findOne({
            where: { accountId: createUserDto.accountId },
        });

        if (existingUser) {
            throw new ConflictException('User with this accountId already exists');
        }

        // Check if username is taken (if provided)
        if (createUserDto.username) {
            const existingUsername = await this.usersRepository.findOne({
                where: { username: createUserDto.username },
            });

            if (existingUsername) {
                throw new ConflictException('Username already taken');
            }
        }

        const user = this.usersRepository.create(createUserDto);
        return await this.usersRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return await this.usersRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<User> {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async findByAccountId(accountId: string): Promise<User | null> {
        return await this.usersRepository.findOne({ where: { accountId } });
    }

    async findByUsername(username: string): Promise<User | null> {
        return await this.usersRepository.findOne({ where: { username } });
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);

        // Check username uniqueness if updating username
        if (updateUserDto.username && updateUserDto.username !== user.username) {
            const existingUsername = await this.usersRepository.findOne({
                where: { username: updateUserDto.username },
            });

            if (existingUsername) {
                throw new ConflictException('Username already taken');
            }
        }

        Object.assign(user, updateUserDto);
        return await this.usersRepository.save(user);
    }

    async updateByAccountId(
        accountId: string,
        updateUserDto: UpdateUserDto,
    ): Promise<User> {
        const user = await this.findByAccountId(accountId);
        if (!user) {
            throw new NotFoundException(`User with accountId ${accountId} not found`);
        }
        return await this.update(user.id, updateUserDto);
    }

    async remove(id: string): Promise<void> {
        const user = await this.findOne(id);
        await this.usersRepository.remove(user);
    }
}

