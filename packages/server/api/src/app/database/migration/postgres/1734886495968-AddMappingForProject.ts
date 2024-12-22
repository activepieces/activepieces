import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddMappingForProject1734886495968 implements MigrationInterface {
    name = 'AddMappingForProject1734886495968'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project"
            ADD "mapping" jsonb
        `)
        await queryRunner.query(`
            UPDATE "project"
            SET "mapping" = "git_repo"."mapping"
            FROM "git_repo"
            WHERE "project"."id" = "git_repo"."projectId"
        `)
        await queryRunner.query(`
            ALTER TABLE "git_repo" DROP COLUMN "mapping"
        `)

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project" DROP COLUMN "mapping"
        `)
        await queryRunner.query(`
            ALTER TABLE "git_repo"
            ADD "mapping" jsonb
        `)
    }

}
