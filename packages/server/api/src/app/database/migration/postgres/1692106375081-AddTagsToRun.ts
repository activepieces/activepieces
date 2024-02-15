import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTagsToRun1692106375081 implements MigrationInterface {
    name = 'AddTagsToRun1692106375081'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "flow_run" ADD "tags" character varying array',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "flow_run" DROP COLUMN "tags"')
    }
}
