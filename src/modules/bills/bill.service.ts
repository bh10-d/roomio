import { Injectable } from "@nestjs/common";
import { InjectRepository} from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Bill } from "./entities/bill.entity";
import { CreateBillDto } from "./dto/create-bill.dto";

@Injectable()
export class BillService {
    constructor(
        @InjectRepository(Bill)
        private billRepository: Repository<Bill>,
    ) {}

    findAll() {
        return this.billRepository.find();
    }

    create(data: CreateBillDto) {
        const bill = this.billRepository.create(data);
        return this.billRepository.save(bill);
    }
}