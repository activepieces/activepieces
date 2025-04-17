import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMetadataFields1743780156664 implements MigrationInterface {
    name = 'AddMetadataFields1743780156664'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
            ADD "metadata" jsonb
        `)
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "metadata" jsonb
        `)
        await queryRunner.query(`
            ALTER TABLE "app_connection"
            ADD "metadata" jsonb
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "app_connection" DROP COLUMN "metadata"
        `)
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "metadata"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow" DROP COLUMN "metadata"
        `)
    }

}
