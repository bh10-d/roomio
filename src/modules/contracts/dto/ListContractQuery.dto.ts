import { Type } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export const ContractStatuses = ['draft', 'active', 'expired', 'terminated'] as const;

export const ContractSortBy = ['created_at', 'start_date', 'end_date', 'status', 'deposit_amount'] as const;

export const SortOrders = ['ASC', 'DESC'] as const;

export class ListContractQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;
    
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 10;
    
    @IsOptional()
    @IsString()
    search: string;

    @IsOptional()
    @IsDateString()
    start_from?: string;

    @IsOptional()
    @IsDateString()
    start_to?: string;

    @IsOptional()
    @IsDateString()
    end_from?: string;

    @IsOptional()
    @IsDateString()
    end_to?: string;
    
    @IsOptional()
    @IsIn(ContractSortBy)
    sortBy: typeof ContractSortBy[number];
    
    @IsOptional()
    @IsIn(SortOrders)
    sortOrder: typeof SortOrders[number];
}