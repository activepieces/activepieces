import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddTriggerNameToTriggerSource1757018269905 implements MigrationInterface {
    name = 'AddTriggerNameToTriggerSource1757018269905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "trigger_source"
            ADD "triggerName" character varying
        `)

        await queryRunner.query(`
            UPDATE "trigger_source"
            SET "triggerName" = (
                SELECT fv.trigger->'settings'->>'triggerName'
                FROM "flow_version" fv
                WHERE fv.id = "trigger_source"."flowVersionId"
            )
        `)

        await queryRunner.query(`
            ALTER TABLE "trigger_source"
            ALTER COLUMN "triggerName" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "trigger_source" DROP COLUMN "triggerName"
        `)
    }

}
