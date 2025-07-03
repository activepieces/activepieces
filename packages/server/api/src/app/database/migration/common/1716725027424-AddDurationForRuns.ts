import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDurationForRuns1716725027424 implements MigrationInterface {
    name = 'AddDurationForRuns1716725027424'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "duration" integer
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "duration"
        `)
    }

}
