import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddWorkerMachineSqlite1720100928449 implements MigrationInterface {
    name = 'AddWorkerMachineSqlite1720100928449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "worker_machine" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21),
                "type" varchar NOT NULL,
                "information" text NOT NULL
            )
        `)
        await queryRunner.query(`
            CREATE TABLE "temporary_worker_machine" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "platformId" varchar(21),
                "type" varchar NOT NULL,
                "information" text NOT NULL,
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
                    "information"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "information"
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
                "information" text NOT NULL
            )
        `)
        await queryRunner.query(`
            INSERT INTO "worker_machine"(
                    "id",
                    "created",
                    "updated",
                    "platformId",
                    "type",
                    "information"
                )
            SELECT "id",
                "created",
                "updated",
                "platformId",
                "type",
                "information"
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
