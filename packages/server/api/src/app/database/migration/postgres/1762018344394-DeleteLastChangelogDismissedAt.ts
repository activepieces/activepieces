import { MigrationInterface, QueryRunner } from 'typeorm'

export class DeleteLastChangelogDismissedAt1762018344394 implements MigrationInterface {
    name = 'DeleteLastChangelogDismissedAt1762018344394'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" DROP COLUMN "lastChangelogDismissed"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user" ADD "lastChangelogDismissed" TIMESTAMP
        `)
    }

}

