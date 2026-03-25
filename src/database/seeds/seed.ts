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
const OCCUPIED_ROOM_RATE = 0.6;
const BILL_MONTHS_PER_OCCUPIED_ROOM = 3;
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

function ensureStringId(entityName: string, id: unknown): asserts id is string {
    if (typeof id !== 'string' || id.trim().length === 0) {
        throw new Error(`Seed expected ${entityName}.id to be string UUID, received: ${String(id)}`);
    }
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

    const occupiedRoomCount = Math.max(1, Math.floor(rooms.length * OCCUPIED_ROOM_RATE));
    const shuffledRooms = [...rooms].sort(() => Math.random() - 0.5);
    const occupiedRooms = shuffledRooms.slice(0, occupiedRoomCount);
    const occupiedRoomIds = new Set(occupiedRooms.map((room) => room.id));

    for (let i = 0; i < rooms.length; i += 1) {
        rooms[i].status = occupiedRoomIds.has(rooms[i].id) ? 'occupied' : 'available';
    }
    await roomRepo.save(rooms);

    const roomUsers: RoomUser[] = [];
    const tenants = users.filter((u) => u.role === 'tenant');
    const contracts: Contract[] = [];
    const bills: Bill[] = [];
    const meterReadings: MeterReading[] = [];
    const maintenanceRequests: MaintenanceRequest[] = [];
    const notifications: Notification[] = [];
    for (let i = 0; i < occupiedRooms.length; i += 1) {
        const room = occupiedRooms[i];
        const tenant = tenants[i % tenants.length];

        const start = new Date();
        start.setDate(start.getDate() - randomInt(20, 120));
        const end = new Date(start);
        end.setMonth(end.getMonth() + 12);

        const roomUser = await roomUserRepo.save(
            roomUserRepo.create({
                room_id: room.id,
                user_id: tenant.id,
                start_date: start,
                end_date: end,
                created_at: start,
                updated_at: start,
            }),
        );
        roomUsers.push(roomUser);

        const contract = await contractRepo.save(
            contractRepo.create({
                room_id: room.id,
                tenant_id: tenant.id,
                start_date: start,
                end_date: end,
                status: 'active',
                deposit_amount: 3000000 + i * 100000,
            }),
        );
        contracts.push(contract);

        for (let monthOffset = 0; monthOffset < BILL_MONTHS_PER_OCCUPIED_ROOM; monthOffset += 1) {
            const month = monthAt(-monthOffset);
            const electricQty = randomInt(90, 180);
            const waterQty = randomInt(10, 25);
            const electricUnitPrice = 3500;
            const waterUnitPrice = 18000;
            const electricAmount = electricQty * electricUnitPrice;
            const waterAmount = waterQty * waterUnitPrice;
            const rentAmount = Number(room.price);
            const totalAmount = rentAmount + electricAmount + waterAmount;
            const billStatus = monthOffset === 0 && i % 2 === 0 ? 'pending' : 'paid';

            const bill = await billRepo.save(
                billRepo.create({
                    room_id: room.id,
                    month,
                    total_amount: totalAmount,
                    status: billStatus,
                }),
            );
            bills.push(bill);

            await billItemRepo.save(
                billItemRepo.create({
                    bill_id: bill.id,
                    type: 'rent',
                    amount: rentAmount,
                    unit_price: 1,
                    quantity: 1,
                }),
            );
            await billItemRepo.save(
                billItemRepo.create({
                    bill_id: bill.id,
                    type: 'electric',
                    amount: electricAmount,
                    unit_price: electricUnitPrice,
                    quantity: electricQty,
                }),
            );
            await billItemRepo.save(
                billItemRepo.create({
                    bill_id: bill.id,
                    type: 'water',
                    amount: waterAmount,
                    unit_price: waterUnitPrice,
                    quantity: waterQty,
                }),
            );

            await paymentRepo.save(
                paymentRepo.create({
                    bill_id: bill.id,
                    amount: billStatus === 'paid' ? totalAmount : Math.floor(totalAmount * 0.6),
                    payment_date: new Date(),
                    method: i % 2 === 0 ? 'cash' : 'bank_transfer',
                    status: billStatus === 'paid' ? 'success' : 'pending',
                }),
            );

            const electricMeter = await meterRepo.save(
                meterRepo.create({
                    room_id: room.id,
                    type: 'electric',
                    previous_reading: 1000 + i * 100 + monthOffset * 120,
                    current_reading: 1000 + i * 100 + monthOffset * 120 + electricQty,
                    month,
                }),
            );
            ensureStringId('MeterReading', electricMeter.id);
            meterReadings.push(electricMeter);

            const waterMeter = await meterRepo.save(
                meterRepo.create({
                    room_id: room.id,
                    type: 'water',
                    previous_reading: 200 + i * 20 + monthOffset * 15,
                    current_reading: 200 + i * 20 + monthOffset * 15 + waterQty,
                    month,
                }),
            );
            ensureStringId('MeterReading', waterMeter.id);
            meterReadings.push(waterMeter);
        }

        if (i % 2 === 0) {
            const now = new Date();
            const maintenance = await maintenanceRepo.save(
                maintenanceRepo.create({
                    room_id: room.id,
                    tenant_id: tenant.id,
                    title: `Maintenance #${i + 1}`,
                    description: 'Need support for room issue',
                    status: i % 4 === 0 ? 'pending' : 'in_progress',
                    created_at: now,
                    updated_at: now,
                }),
            );
            ensureStringId('MaintenanceRequest', maintenance.id);
            maintenanceRequests.push(maintenance);
        }
    }

    for (let i = 0; i < COUNT; i += 1) {
        const user = users[i % users.length];
        const notification = await notificationRepo.save(
            notificationRepo.create({
                user_id: user.id,
                title: `Notification #${i + 1}`,
                content: 'This is seeded notification content',
                is_read: i % 2 === 0,
                created_at: new Date(),
                type: i % 2 === 0 ? 'system' : 'bill',
            }),
        );
        ensureStringId('Notification', notification.id);
        notifications.push(notification);
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
        `Seed success: users=${users.length}, houses=${houses.length}, floors=${floors.length}, rooms=${rooms.length}, roomUsers=${roomUsers.length}, contracts=${contracts.length}, bills=${bills.length}, meterReadings=${meterReadings.length}, maintenance=${maintenanceRequests.length}, notifications=${notifications.length}`,
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
