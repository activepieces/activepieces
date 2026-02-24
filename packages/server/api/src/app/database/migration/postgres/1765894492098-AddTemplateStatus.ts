import { MigrationInterface, QueryRunner } from 'typeorm'

enum TemplateStatus {
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
}

export class AddTemplateStatus1765894492098 implements MigrationInterface {
    name = 'AddTemplateStatus1765894492098'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template"
            ADD "status" character varying
        `)

        await queryRunner.query(`
            UPDATE "template"
            SET "status" = '${TemplateStatus.PUBLISHED}'
        `)

        await queryRunner.query(`
            ALTER TABLE "template"
            ALTER COLUMN "status" SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "template" DROP COLUMN "status"
        `)
    }

}
