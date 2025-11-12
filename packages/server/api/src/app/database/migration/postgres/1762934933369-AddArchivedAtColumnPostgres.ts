import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddArchivedAtColumnPostgres1762934933369 implements MigrationInterface {
    name = 'AddArchivedAtColumnPostgres1762934933369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "archivedAt" character varying
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "archivedAt"
        `)
    }

}
