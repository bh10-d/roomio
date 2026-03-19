import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { User } from '../../modules/users/entities/user.entity';
import { House } from '../../modules/houses/entities/house.entity';
import { Floor } from '../../modules/floors/entities/floor.entity';
import { Room } from '../../modules/rooms/entities/room.entity';
import { RoomUser } from '../../modules/rooms/entities/room-user.entity';
import { Contract } from '../../modules/contracts/entities/contract.entity';
import { Bill } from '../../modules/bills/entities/bill.entity';
import { BillItem } from '../../modules/bills/entities/bill-item.entity';
import { Payment } from '../../modules/bills/entities/payment.entity';
import { MeterReading } from '../../modules/meters/entities/meter-reading.entity';
import { MaintenanceRequest } from '../../modules/maintenance/entities/maintenance-request.entity';
import { Notification } from '../../modules/notifications/entities/notification.entity';
import { HouseStaff } from '../../modules/houses/entities/house-staff.entity';

const COUNT = 10;
const MIN_FLOORS_PER_HOUSE = 2;
const MAX_FLOORS_PER_HOUSE = 3;
const MIN_ROOMS_PER_FLOOR = 2;
const MAX_ROOMS_PER_FLOOR = 4;
const runTag = Date.now();

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'roomio',
    entities: [
        User,
        House,
        Floor,
        Room,
        RoomUser,
        Contract,
        Bill,
        BillItem,
        Payment,
        MeterReading,
        MaintenanceRequest,
        Notification,
        HouseStaff,
    ],
    synchronize: false,
});

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function monthAt(offset: number): Date {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCMonth(d.getUTCMonth() + offset);
    return d;
}

async function seed(): Promise<void> {
    await dataSource.initialize();

    const userRepo = dataSource.getRepository(User);
    const houseRepo = dataSource.getRepository(House);
    const floorRepo = dataSource.getRepository(Floor);
    const roomRepo = dataSource.getRepository(Room);
    const roomUserRepo = dataSource.getRepository(RoomUser);
    const contractRepo = dataSource.getRepository(Contract);
    const billRepo = dataSource.getRepository(Bill);
    const billItemRepo = dataSource.getRepository(BillItem);
    const paymentRepo = dataSource.getRepository(Payment);
    const meterRepo = dataSource.getRepository(MeterReading);
    const maintenanceRepo = dataSource.getRepository(MaintenanceRequest);
    const notificationRepo = dataSource.getRepository(Notification);
    const houseStaffRepo = dataSource.getRepository(HouseStaff);

    const users: User[] = [];
    for (let i = 0; i < COUNT; i += 1) {
        const role = i < 2 ? 'landlord' : i < 4 ? 'admin' : 'tenant';
        const user = userRepo.create({
            name: `User ${i + 1}`,
            phone: `0900${(100000 + i).toString().slice(-6)}`,
            email: `seed_${runTag}_${i + 1}@roomio.dev`,
            role,
            password: '123456',
        });
        users.push(await userRepo.save(user));
    }

    const landlords = users.filter((u) => u.role === 'landlord');

    const houses: House[] = [];
    for (let i = 0; i < COUNT; i += 1) {
        const landlord = pickRandom(landlords);
        const house = houseRepo.create({
            landlord_id: landlord.id,
            name: `House ${i + 1}`,
            address: `Street ${i + 1}, District ${((i % 5) + 1).toString()}`,
        });
        houses.push(await houseRepo.save(house));
    }

    const floors: Floor[] = [];
    for (let i = 0; i < houses.length; i += 1) {
        const house = houses[i];
        const floorCount = randomInt(MIN_FLOORS_PER_HOUSE, MAX_FLOORS_PER_HOUSE);

        for (let floorNo = 1; floorNo <= floorCount; floorNo += 1) {
            const floor = floorRepo.create({
                house_id: house.id,
                floor_no: floorNo,
            });
            floors.push(await floorRepo.save(floor));
        }
    }

    const rooms: Room[] = [];
    let roomSequence = 100;
    for (let i = 0; i < floors.length; i += 1) {
        const floor = floors[i];
        const roomsPerFloor = randomInt(MIN_ROOMS_PER_FLOOR, MAX_ROOMS_PER_FLOOR);

        for (let j = 0; j < roomsPerFloor; j += 1) {
            const room = roomRepo.create({
                floor_id: floor.id,
                name: `Room ${roomSequence}`,
                price: 2000000 + (roomSequence - 100) * 80000,
                capacity: ((roomSequence - 100) % 4) + 1,
                status: roomSequence % 3 === 0 ? 'occupied' : 'available',
            });
            rooms.push(await roomRepo.save(room));
            roomSequence += 1;
        }
    }

    const roomUsers: RoomUser[] = [];
    const tenants = users.filter((u) => u.role === 'tenant');
    for (let i = 0; i < COUNT; i += 1) {
        const room = pickRandom(rooms);
        const tenant = pickRandom(tenants);
        const start = new Date();
        start.setDate(start.getDate() - i * 2);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 6);

        const row = roomUserRepo.create({
            room_id: room.id,
            user_id: tenant.id,
            start_date: start,
            end_date: end,
            created_at: start,
            updated_at: start,
        });
        roomUsers.push(await roomUserRepo.save(row));
    }

    const contracts: Contract[] = [];
    for (let i = 0; i < COUNT; i += 1) {
        const link = roomUsers[i % roomUsers.length];
        const start = new Date();
        start.setDate(start.getDate() - 30 - i);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 12);

        const contract = contractRepo.create({
            room_id: link.room_id,
            tenant_id: link.user_id,
            start_date: start,
            end_date: end,
            status: 'active',
            deposit_amount: 3000000 + i * 100000,
        });
        contracts.push(await contractRepo.save(contract));
    }

    const bills: Bill[] = [];
    for (let i = 0; i < COUNT; i += 1) {
        const room = rooms[i % rooms.length];
        const bill = billRepo.create({
            room_id: room.id,
            month: monthAt(i),
            total_amount: 2500000 + i * 120000,
            status: i % 2 === 0 ? 'pending' : 'paid',
        });
        bills.push(await billRepo.save(bill));
    }

    for (let i = 0; i < COUNT; i += 1) {
        const bill = bills[i % bills.length];
        await billItemRepo.save(
            billItemRepo.create({
                bill_id: bill.id,
                type: i % 2 === 0 ? 'rent' : 'electric',
                amount: 2000000 + i * 100000,
                unit_price: i % 2 === 0 ? 1 : 3500,
                quantity: i % 2 === 0 ? 1 : 150 + i,
            }),
        );
    }

    for (let i = 0; i < COUNT; i += 1) {
        const bill = bills[i % bills.length];
        await paymentRepo.save(
            paymentRepo.create({
                bill_id: bill.id,
                amount: 1000000 + i * 100000,
                payment_date: new Date(),
                method: i % 2 === 0 ? 'cash' : 'bank_transfer',
                status: i % 3 === 0 ? 'pending' : 'success',
            }),
        );
    }

    for (let i = 0; i < COUNT; i += 1) {
        const room = rooms[i % rooms.length];
        await meterRepo.save(
            meterRepo.create({
                room_id: room.id,
                type: i % 2 === 0 ? 'electric' : 'water',
                previous_reading: 100 + i * 10,
                current_reading: 130 + i * 10,
                month: monthAt(i),
            }),
        );
    }

    for (let i = 0; i < COUNT; i += 1) {
        const link = roomUsers[i % roomUsers.length];
        const now = new Date();
        await maintenanceRepo.save(
            maintenanceRepo.create({
                room_id: link.room_id,
                tenant_id: link.user_id,
                title: `Maintenance #${i + 1}`,
                description: 'Need support for room issue',
                status: i % 2 === 0 ? 'pending' : 'in_progress',
                created_at: now,
                updated_at: now,
            }),
        );
    }

    for (let i = 0; i < COUNT; i += 1) {
        const user = users[i % users.length];
        await notificationRepo.save(
            notificationRepo.create({
                user_id: user.id,
                title: `Notification #${i + 1}`,
                content: 'This is seeded notification content',
                is_read: i % 2 === 0,
                created_at: new Date(),
                type: i % 2 === 0 ? 'system' : 'bill',
            }),
        );
    }

    for (let i = 0; i < COUNT; i += 1) {
        const house = houses[i % houses.length];
        const user = users[i % users.length];
        await houseStaffRepo.save(
            houseStaffRepo.create({
                house_id: house.id,
                user_id: user.id,
                role: i % 2 === 0 ? 'manager' : 'security',
            }),
        );
    }

    console.log(
        `Seed success: users=${users.length}, houses=${houses.length}, floors=${floors.length}, rooms=${rooms.length}, others~${COUNT}`,
    );
    await dataSource.destroy();
}

seed().catch(async (error) => {
    console.error('Seed failed:', error);
    if (dataSource.isInitialized) {
        await dataSource.destroy();
    }
    process.exit(1);
});
