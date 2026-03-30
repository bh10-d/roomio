import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@Roles('admin') // Only users with 'admin' role can access these routes
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get()
    findAll() {
        return this.userService.findAll();
    }

    @Get(':user_id')
    @Roles('admin', 'landlord') // Both 'admin' and 'landlord' roles can access this route
    findOne(@Param('user_id') userId: string) {
        return this.userService.findOne(userId);
    }

    @Post()
    create(@Body() body: CreateUserDto) {
        return this.userService.create(body);
    }

    @Put(':user_id')
    update(@Param('user_id') userId: string, @Body() body: UpdateUserDto) {
        return this.userService.update(userId, body);
    }

    @Delete(':user_id')
    delete(@Param('user_id') userId: string) {
        return this.userService.delete(userId);
    }
}