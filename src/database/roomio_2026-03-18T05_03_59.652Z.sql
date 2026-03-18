
CREATE TABLE IF NOT EXISTS "bills" (
	"id" uuid NOT NULL UNIQUE,
	"room_id" uuid NOT NULL,
	"month" date NOT NULL,
	"total_amount" decimal,
	-- pending | paid | partial | overdue
	"status" varchar(255) NOT NULL,
	"created_at" TIMESTAMPTZ,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);

COMMENT ON TABLE bills IS 'INDEX (room_id)
UNIQUE (room_id, month)';
COMMENT ON COLUMN bills.status IS 'pending | paid | partial | overdue';


CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid NOT NULL UNIQUE,
	"name" varchar(255),
	"phone" varchar(20),
	"email" varchar(255),
	-- admin | landlord | tenant
	"role" varchar(255),
	"created_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);

COMMENT ON TABLE users IS 'INDEX (user_id)';
COMMENT ON COLUMN users.role IS 'admin | landlord | tenant';


CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial NOT NULL UNIQUE,
	"bill_id" uuid NOT NULL,
	"amount" decimal NOT NULL,
	"payment_date" TIMESTAMPTZ,
	"method" varchar(255),
	"created_at" TIMESTAMPTZ,
	"updated_at" TIMESTAMPTZ,
	-- success | pending | failed
	"status" varchar(255),
	PRIMARY KEY("id")
);

COMMENT ON TABLE payments IS 'INDEX (bill_id)';
COMMENT ON COLUMN payments.status IS 'success | pending | failed';


CREATE TABLE IF NOT EXISTS "rooms" (
	"id" uuid NOT NULL UNIQUE,
	"house_id" uuid NOT NULL,
	"name" varchar(255),
	"price" decimal NOT NULL,
	"capacity" int,
	-- available | occupied
	"status" varchar(255),
	PRIMARY KEY("id")
);

COMMENT ON TABLE rooms IS 'INDEX (room_id)';
COMMENT ON COLUMN rooms.status IS 'available | occupied';


CREATE TABLE IF NOT EXISTS "contracts" (
	"id" serial NOT NULL UNIQUE,
	"room_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"start_date" TIMESTAMPTZ,
	"end_date" TIMESTAMPTZ,
	-- status: active | expired | terminated
	"status" varchar(255),
	"deposit_amount" decimal,
	"created_at" TIMESTAMPTZ,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);
COMMENT ON COLUMN contracts.status IS 'status: active | expired | terminated';


CREATE TABLE IF NOT EXISTS "houses" (
	"id" uuid NOT NULL UNIQUE,
	"landlord_id" uuid,
	"name" varchar(255),
	"address" varchar(255),
	"created_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);


CREATE TABLE IF NOT EXISTS "room_users" (
	"id" uuid NOT NULL UNIQUE,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"start_date" TIMESTAMPTZ,
	"end_date" TIMESTAMPTZ,
	"created_at" TIMESTAMPTZ,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);


CREATE TABLE IF NOT EXISTS "meter_readings" (
	"id" serial NOT NULL UNIQUE,
	"room_id" uuid NOT NULL,
	-- electric | water
	"type" varchar(255) NOT NULL,
	"previous_reading" decimal,
	"current_reading" decimal,
	"month" date NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE meter_readings IS 'UNIQUE (room_id, type, month)
';
COMMENT ON COLUMN meter_readings.type IS 'electric | water';


CREATE TABLE IF NOT EXISTS "bill_items" (
	"id" uuid NOT NULL UNIQUE,
	"bill_id" uuid NOT NULL,
	-- electric | water | rent | service
	"type" varchar(255),
	"amount" decimal,
	"unit_price" decimal,
	"quantity" int,
	PRIMARY KEY("id")
);
COMMENT ON COLUMN bill_items.type IS 'electric | water | rent | service';


CREATE TABLE IF NOT EXISTS "notifications" (
	"id" serial NOT NULL UNIQUE,
	"user_id" uuid NOT NULL,
	"title" varchar(255),
	"content" text(65535),
	"is_read" boolean,
	"created_at" TIMESTAMPTZ,
	-- bill | system | maintenance
	"type" varchar(255),
	PRIMARY KEY("id")
);
COMMENT ON COLUMN notifications.type IS 'bill | system | maintenance';


CREATE TABLE IF NOT EXISTS "maintenance_requests" (
	"id" serial NOT NULL UNIQUE,
	"room_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"title" varchar(255),
	"description" text(65535),
	-- pending | in_progress | done | cancelled
	"status" varchar(255),
	"created_at" TIMESTAMPTZ,
	"updated_at" TIMESTAMPTZ,
	PRIMARY KEY("id")
);
COMMENT ON COLUMN maintenance_requests.status IS 'pending | in_progress | done | cancelled';


CREATE TABLE IF NOT EXISTS "houses_staff" (
	"id" serial NOT NULL UNIQUE,
	"house_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	-- manager | security | ...
	"role" varchar(255),
	PRIMARY KEY("id")
);
COMMENT ON COLUMN houses_staff.role IS 'manager | security | ...';


ALTER TABLE "houses"
ADD FOREIGN KEY("landlord_id") REFERENCES "users"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "houses"
ADD FOREIGN KEY("id") REFERENCES "rooms"("house_id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "room_users"
ADD FOREIGN KEY("room_id") REFERENCES "rooms"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "room_users"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "bills"
ADD FOREIGN KEY("room_id") REFERENCES "rooms"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "payments"
ADD FOREIGN KEY("bill_id") REFERENCES "bills"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "contracts"
ADD FOREIGN KEY("room_id") REFERENCES "rooms"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "contracts"
ADD FOREIGN KEY("tenant_id") REFERENCES "users"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "meter_readings"
ADD FOREIGN KEY("room_id") REFERENCES "rooms"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "bill_items"
ADD FOREIGN KEY("bill_id") REFERENCES "bills"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "notifications"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "maintenance_requests"
ADD FOREIGN KEY("room_id") REFERENCES "rooms"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "maintenance_requests"
ADD FOREIGN KEY("tenant_id") REFERENCES "users"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "houses_staff"
ADD FOREIGN KEY("house_id") REFERENCES "houses"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;
ALTER TABLE "houses_staff"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE NO ACTION ON DELETE NO ACTION;