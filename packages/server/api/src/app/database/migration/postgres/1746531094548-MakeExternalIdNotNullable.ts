import { MigrationInterface, QueryRunner } from 'typeorm'

export class MakeExternalIdNotNullable1746531094548 implements MigrationInterface {
    name = 'MakeExternalIdNotNullable1746531094548'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE flow SET "externalId" = "id" WHERE "externalId" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "flow"
            ALTER COLUMN "externalId"
            SET NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flow"
            ALTER COLUMN "externalId" DROP NOT NULL
        `)
    }

}
