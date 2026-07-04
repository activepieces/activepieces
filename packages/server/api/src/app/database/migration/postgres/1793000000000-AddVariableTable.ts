import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddVariableTable1793000000000 implements Migration {
    name = 'AddVariableTable1793000000000'
    breaking = false
    release = '0.83.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "variable" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "name" character varying NOT NULL,
                "projectId" character varying NOT NULL,
                "platformId" character varying NOT NULL,
                "ownerId" character varying,
                "value" jsonb NOT NULL,
                "metadata" jsonb,
                CONSTRAINT "PK_variable_id" PRIMARY KEY ("id")
            )
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_variable_project_id_and_name"
            ON "variable" ("projectId", "name")
        `)

        await queryRunner.query(`
            CREATE INDEX "idx_variable_owner_id"
            ON "variable" ("ownerId")
        `)

        await queryRunner.query(`
            ALTER TABLE "variable"
            ADD CONSTRAINT "fk_variable_owner_id"
            FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "variable" DROP CONSTRAINT IF EXISTS "fk_variable_owner_id"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_variable_owner_id"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_variable_project_id_and_name"')
        await queryRunner.query('DROP TABLE IF EXISTS "variable"')
    }
}
