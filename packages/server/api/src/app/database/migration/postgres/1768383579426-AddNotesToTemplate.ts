import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddNotesToTemplate1768383579426 implements MigrationInterface {
    name = 'AddNotesToTemplate1768383579426'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "template"
            SET "flows" = (
                SELECT jsonb_agg(
                    CASE
                        WHEN flow->>'notes' IS NULL THEN flow || '{"notes": []}'::jsonb
                        ELSE flow
                    END
                )
                FROM jsonb_array_elements("flows") AS flow
            )
            WHERE "flows" IS NOT NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "template"
            SET "flows" = (
                SELECT jsonb_agg(flow - 'notes')
                FROM jsonb_array_elements("flows") AS flow
            )
            WHERE "flows" IS NOT NULL
        `)
    }

}
