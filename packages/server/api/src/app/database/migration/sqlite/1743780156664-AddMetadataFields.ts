import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1743780156664 implements MigrationInterface {
    name = 'Migration1743780156664'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "metadata" text DEFAULT '{}'
        `);
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "metadata" text DEFAULT '{}'
        `);
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "metadata" text DEFAULT '{}'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP COLUMN "metadata"
        `);
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "metadata"
        `);
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "metadata"
        `);
    }
} 