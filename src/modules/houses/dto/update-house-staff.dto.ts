import { PartialType } from "@nestjs/swagger";
import { CreateHouseStaffDto } from "./create-house-staff.dto";

export class UpdateHouseStaffDto extends PartialType(CreateHouseStaffDto) {}