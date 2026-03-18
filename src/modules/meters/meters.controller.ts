import { Controller } from '@nestjs/common';
import { MetersService } from './meters.service';

@Controller('meters')
export class MetersController {
    constructor(private readonly metersService: MetersService) {}
}
