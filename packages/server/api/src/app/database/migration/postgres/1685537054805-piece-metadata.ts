import { AppSystemProp, DatabaseType } from '@activepieces/server-shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()
const databaseType = system.get(AppSystemProp.DB_TYPE)

const tableWithCollation = `
CREATE TABLE "piece_metadata" (
    "id" character varying(21) NOT NULL,
    "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "name" character varying NOT NULL,
    "displayName" character varying NOT NULL,
    "logoUrl" character varying NOT NULL,
    "description" character varying,
    "version" character varying COLLATE "en_natural" NOT NULL,
    "minimumSupportedRelease" character varying COLLATE "en_natural" NOT NULL,
    "maximumSupportedRelease" character varying COLLATE "en_natural" NOT NULL,
    "actions" jsonb NOT NULL,
    "triggers" jsonb NOT NULL,
    CONSTRAINT "PK_b045821e9caf2be9aba520d96da" PRIMARY KEY ("id")
)`
const tableWithoutCollation = `
CREATE TABLE "piece_metadata" (
    "id" character varying(21) NOT NULL,
    "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "name" character varying NOT NULL,
    "displayName" character varying NOT NULL,
    "logoUrl" character varying NOT NULL,
    "description" character varying,
    "version" character varying NOT NULL,
    "minimumSupportedRelease" character varying NOT NULL,
    "maximumSupportedRelease" character varying NOT NULL,
    "actions" jsonb NOT NULL,
    "triggers" jsonb NOT NULL,
    CONSTRAINT "PK_b045821e9caf2be9aba520d96da" PRIMARY KEY ("id")
)`

export class PieceMetadata1685537054805 implements MigrationInterface {
    name = 'PieceMetadata1685537054805'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (databaseType !== DatabaseType.PGLITE) {
            await queryRunner.query(
                'CREATE COLLATION en_natural (LOCALE = \'en-US-u-kn-true\', PROVIDER = \'icu\')',
            )
            await queryRunner.query(tableWithCollation)
        }
        else {
            await queryRunner.query(tableWithoutCollation)
        }
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_piece_metadata_name_version" ON "piece_metadata" ("name", "version")',
        )
        log.info('[PieceMetadata1685537054805] up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (databaseType !== DatabaseType.PGLITE) {
            await queryRunner.query('DROP COLLATION en_natural')
        }
        await queryRunner.query('DROP INDEX "idx_piece_metadata_name_version"')
        await queryRunner.query('DROP TABLE "piece_metadata"')
        log.info('[PieceMetadata1685537054805] down')
    }
}