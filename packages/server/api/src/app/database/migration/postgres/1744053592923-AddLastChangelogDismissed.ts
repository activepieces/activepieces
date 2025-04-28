import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddLastChangelogDismissed1744053592923 implements MigrationInterface {
    name = 'AddLastChangelogDismissed1744053592923'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user"
            ADD "lastChangelogDismissed" TIMESTAMP WITH TIME ZONE
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "lastChangelogDismissed"
        `)
    }

}
