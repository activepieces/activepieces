import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddDisplayNameToSigningKey1698698190965 implements MigrationInterface {
    name = 'AddDisplayNameToSigningKey1698698190965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "signing_key"
            ADD "displayName" character varying NOT NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "chatbot"
            ALTER COLUMN "visibilityStatus" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "chatbot"
            ALTER COLUMN "visibilityStatus" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "botPlanName" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "bots" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "datasourcesSize" DROP DEFAULT
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "datasources" DROP DEFAULT
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "datasources"
            SET DEFAULT '1'
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "datasourcesSize"
            SET DEFAULT '10485760'
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "bots"
            SET DEFAULT '1'
        `)
        await queryRunner.query(`
            ALTER TABLE "project_plan"
            ALTER COLUMN "botPlanName"
            SET DEFAULT 'free'
        `)
        await queryRunner.query(`
            ALTER TABLE "chatbot"
            ALTER COLUMN "visibilityStatus"
            SET DEFAULT 'PRIVATE'
        `)
        await queryRunner.query(`
            ALTER TABLE "chatbot"
            ALTER COLUMN "visibilityStatus"
            SET DEFAULT 'PRIVATE'
        `)
        await queryRunner.query(`
            ALTER TABLE "signing_key" DROP COLUMN "displayName"
        `)
    }

}
