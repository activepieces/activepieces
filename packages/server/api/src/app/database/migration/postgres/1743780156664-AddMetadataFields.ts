import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1743780156664 implements MigrationInterface {
    name = 'Migration1743780156664'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "metadata" jsonb DEFAULT '{}'
        `);
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "metadata" jsonb DEFAULT '{}'
        `);
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "metadata" jsonb DEFAULT '{}'
        `);
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_platform_id" FOREIGN KEY ("platformId") REFERENCES "platform"("id") ON DELETE RESTRICT ON UPDATE RESTRICT
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP CONSTRAINT "fk_project_platform_id"
        `);
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
