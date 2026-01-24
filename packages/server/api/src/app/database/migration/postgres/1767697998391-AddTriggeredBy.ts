import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTriggeredBy1767697998391 implements MigrationInterface {
    name = 'AddTriggeredBy1767697998391'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "user_badge" WHERE name IN ('victory', 'back-again')
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD "triggeredBy" character varying
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run"
            ADD CONSTRAINT "fk_flow_run_triggered_by_user_id" FOREIGN KEY ("triggeredBy") REFERENCES "user"("id") ON DELETE
            SET NULL ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_triggered_by_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "flow_run" DROP COLUMN "triggeredBy"
        `)
    }

}
