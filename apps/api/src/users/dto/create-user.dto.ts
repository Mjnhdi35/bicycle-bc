import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
    @IsString()
    @MinLength(1)
    accountId: string; // Substrate AccountId

    @IsOptional()
    @IsString()
    @MaxLength(32)
    username?: string;

    @IsOptional()
    @IsString()
    avatar?: string;

    @IsOptional()
    @IsString()
    @MaxLength(256)
    bio?: string;
}

