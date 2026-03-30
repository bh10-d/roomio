import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    private sanitizeUser(user: User) {
        const { password, ...safeUser } = user;
        return safeUser;
    }

    private normalizeEmail(email: string) {
        const normalized = email.trim().toLowerCase();
        if (!normalized) {
            throw new BadRequestException('Email is required');
    }

        return normalized;
    }

    async findAll() {
        const users = await this.userRepository.find({
            order: { created_at: 'DESC' },
        });

        return {
            data: users.map((user) => this.sanitizeUser(user)),
        };
    }

    async findOne(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        return { data: this.sanitizeUser(user) };
    }

    async create(data: CreateUserDto) {
        const email = this.normalizeEmail(data.email);

        const emailExists = await this.userRepository.exist({ where: { email } });
        if (emailExists) {
            throw new ConflictException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const user = this.userRepository.create({
            ...data,
            email,
            password: hashedPassword,
        });

        const savedUser = await this.userRepository.save(user);
        return { data: this.sanitizeUser(savedUser) };
    }

    async update(userId: string, data: UpdateUserDto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const nextData: UpdateUserDto = { ...data };

        if (typeof data.email === 'string') {
            const normalizedEmail = this.normalizeEmail(data.email);

            const sameEmail = normalizedEmail === user.email;
            if (!sameEmail) {
                const emailExists = await this.userRepository.exist({
                    where: { email: normalizedEmail },
                });
                if (emailExists) {
                    throw new ConflictException('Email already exists');
                }
            }

            nextData.email = normalizedEmail;
        }

        if (typeof data.password === 'string' && data.password.trim().length > 0) {
            nextData.password = await bcrypt.hash(data.password, 10);
        }

        const merged = this.userRepository.merge(user, nextData);
        const savedUser = await this.userRepository.save(merged);

        return { data: this.sanitizeUser(savedUser) };
    }

    async delete(userId: string) {
        const result = await this.userRepository.delete({ id: userId });
        if (result.affected === 0) {
            throw new NotFoundException('User not found');
        }

        return {
            message: 'User deleted successfully',
            userId,
        };
    }
}