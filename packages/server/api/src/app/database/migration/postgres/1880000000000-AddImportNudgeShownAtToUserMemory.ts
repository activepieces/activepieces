import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddImportNudgeShownAtToUserMemory1880000000000 implements Migration {
    name = 'AddImportNudgeShownAtToUserMemory1880000000000'
    breaking = false
    release = '0.93.0'
    transaction = true

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_memory" ADD COLUMN "importNudgeShownAt" TIMESTAMP WITH TIME ZONE
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_memory" DROP COLUMN "importNudgeShownAt"
        `)
    }
}
