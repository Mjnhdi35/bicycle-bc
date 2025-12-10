import { IsString, IsOptional, MaxLength, IsInt, IsNumberString } from 'class-validator';

export class UpdateUserDto {
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

    @IsOptional()
    @IsInt()
    totalRaces?: number;

    @IsOptional()
    @IsInt()
    wins?: number;

    @IsOptional()
    @IsNumberString()
    totalDistance?: string;

    @IsOptional()
    @IsString()
    totalRewards?: string;

    @IsOptional()
    @IsInt()
    createdAtBlock?: number;
}

