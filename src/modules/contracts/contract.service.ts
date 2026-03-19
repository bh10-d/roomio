import { Injectable } from "@nestjs/common";
import { InjectRepository} from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Contract } from "./entities/contract.entity";
import { CreateContractDto } from "./dto/create-contract.dto";

@Injectable()
export class ContractService {
    constructor(
        @InjectRepository(Contract)
        private contractRepository: Repository<Contract>,
    ) {}

    findAll() {
        return this.contractRepository.find();
    }

    create(data: CreateContractDto) {
        const contract = this.contractRepository.create(data);
        return this.contractRepository.save(contract);
    }
}