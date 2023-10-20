import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCustomDomainEntitySqlite31697809582553 implements MigrationInterface {
    name = 'AddCustomDomainEntitySqlite31697809582553'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "custom_domain" (
                "id" varchar(21) PRIMARY KEY NOT NULL,
                "created" datetime NOT NULL DEFAULT (datetime('now')),
                "updated" datetime NOT NULL DEFAULT (datetime('now')),
                "domain" varchar NOT NULL,
                "status" varchar CHECK("status" IN ('ACTIVE', 'PENDING')) NOT NULL
            )
        `);
        await queryRunner.query(`
            CREATE UNIQUE INDEX "custom_domain_domain_unique" ON "custom_domain" ("domain")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "custom_domain_domain_unique"
        `);
        await queryRunner.query(`
            DROP TABLE "custom_domain"
        `);
    }

}
