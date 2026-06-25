import { QueryRunner } from 'typeorm'
import { Migration } from '../../migration'

export class AddPieceSetTable1797000000000 implements Migration {
    name = 'AddPieceSetTable1797000000000'
    breaking = false
    release = '0.102.0'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "piece_set" (
                "id" character varying(21) NOT NULL,
                "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "platformId" character varying(21) NOT NULL,
                "name" character varying NOT NULL,
                "externalId" character varying,
                "isDefault" boolean NOT NULL DEFAULT false,
                "includeNewPieces" boolean NOT NULL DEFAULT true,
                "includeNewActions" boolean NOT NULL DEFAULT true,
                "generatedForProjectId" character varying(21),
                "config" jsonb NOT NULL DEFAULT '{"pieceOverrides":{},"actionOverrides":{},"triggerOverrides":{}}',
                CONSTRAINT "pk_piece_set" PRIMARY KEY ("id"),
                CONSTRAINT "fk_piece_set_platform_id" FOREIGN KEY ("platformId")
                    REFERENCES "platform"("id") ON DELETE CASCADE
            )
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_piece_set_platform_id"
            ON "piece_set" ("platformId")
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_piece_set_platform_id_is_default"
            ON "piece_set" ("platformId")
            WHERE "isDefault" = true
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_piece_set_platform_id_external_id"
            ON "piece_set" ("platformId", "externalId")
            WHERE "externalId" IS NOT NULL
        `)

        await queryRunner.query(`
            ALTER TABLE "project"
            ADD COLUMN IF NOT EXISTS "pieceSetId" character varying(21)
        `)

        await queryRunner.query(`
            ALTER TABLE "project"
            ADD CONSTRAINT "fk_project_piece_set_id"
            FOREIGN KEY ("pieceSetId") REFERENCES "piece_set"("id") ON DELETE SET NULL
        `)

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_project_piece_set_id"
            ON "project" ("pieceSetId")
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP INDEX IF EXISTS "idx_project_piece_set_id"')
        await queryRunner.query('ALTER TABLE "project" DROP CONSTRAINT IF EXISTS "fk_project_piece_set_id"')
        await queryRunner.query('ALTER TABLE "project" DROP COLUMN IF EXISTS "pieceSetId"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_piece_set_platform_id_external_id"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_piece_set_platform_id_is_default"')
        await queryRunner.query('DROP INDEX IF EXISTS "idx_piece_set_platform_id"')
        await queryRunner.query('DROP TABLE IF EXISTS "piece_set"')
    }
}
