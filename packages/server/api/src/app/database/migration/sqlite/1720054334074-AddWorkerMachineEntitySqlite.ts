import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWorkerMachineEntitySqlite1720054334074 implements MigrationInterface {
    name = 'AddWorkerMachineEntitySqlite1720054334074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "worker_machine" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21),
                "type" varchar NOT NULL,
                "cpuUsage" float NOT NULL,
                "ramUsage" float NOT NULL,
                "totalRamInBytes" bigint NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_worker_machine" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21),
                "type" varchar NOT NULL,
                "cpuUsage" float NOT NULL,
                "ramUsage" float NOT NULL,
                "totalRamInBytes" bigint NOT NULL,
                CONSTRAINT "FK_7f3c83a5162a2de787dc62bf519" FOREIGN KEY ("platformId") REFERENCES "platform" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            INSERT INTO "temporary_worker_machine"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "type",
                    "cpuUsage",
                    "ramUsage",
                    "totalRamInBytes"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "cpuUsage",
                "ramUsage",
                "totalRamInBytes"
            FROM "worker_machine"
        `)
        await queryRunner.query(`
            DROP TABLE "worker_machine"
        `)
        await queryRunner.query(`
            ALTER TABLE "temporary_worker_machine"
                RENAME TO "worker_machine"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "worker_machine"
                RENAME TO "temporary_worker_machine"
        `)
        await queryRunner.query(`
            CREATE TABLE "worker_machine" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21),
                "type" varchar NOT NULL,
                "cpuUsage" float NOT NULL,
                "ramUsage" float NOT NULL,
                "totalRamInBytes" bigint NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "worker_machine"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "type",
                    "cpuUsage",
                    "ramUsage",
                    "totalRamInBytes"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "cpuUsage",
                "ramUsage",
                "totalRamInBytes"
            FROM "temporary_worker_machine"
        `)
        await queryRunner.query(`
            DROP TABLE "temporary_worker_machine"
        `)
        await queryRunner.query(`
            DROP TABLE "worker_machine"
        `)
    }

}
