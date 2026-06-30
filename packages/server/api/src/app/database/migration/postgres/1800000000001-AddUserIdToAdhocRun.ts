import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddUserIdToAdhocRun1800000000001 implements Migration {
    name = 'AddUserIdToAdhocRun1800000000001'
    breaking = false
    release = '0.85.4'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "adhoc_run" ADD "userId" character varying(21)
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_adhoc_run_user_id" ON "adhoc_run" ("userId")
        `)
        await queryRunner.query(`
            ALTER TABLE "adhoc_run"
            ADD CONSTRAINT "fk_adhoc_run_user_id" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "adhoc_run" DROP CONSTRAINT "fk_adhoc_run_user_id"
        `)
        await queryRunner.query(`
            DROP INDEX "idx_adhoc_run_user_id"
        `)
        await queryRunner.query(`
            ALTER TABLE "adhoc_run" DROP COLUMN "userId"
        `)
    }
}
