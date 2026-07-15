import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddFieldPosition1810000000000 implements Migration {
    name = 'AddFieldPosition1810000000000'
    breaking = false
    release = '0.86.3'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "field"
            ADD "position" integer NOT NULL DEFAULT '0'
        `)
        await queryRunner.query(`
            UPDATE "field"
            SET "position" = ranked.rn
            FROM (
                SELECT "id",
                    ROW_NUMBER() OVER (
                        PARTITION BY "tableId"
                        ORDER BY "created" ASC
                    ) - 1 AS rn
                FROM "field"
            ) AS ranked
            WHERE "field"."id" = ranked."id"
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "field" DROP COLUMN "position"
        `)
    }
}
