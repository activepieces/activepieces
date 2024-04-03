import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class AddPieceTypeAndPackageTypeToPieceMetadata1696016228398
implements MigrationInterface {
    name = 'AddPieceTypeAndPackageTypeToPieceMetadata1696016228398'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE "temporary_piece_metadata" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "displayName" varchar NOT NULL, "logoUrl" varchar NOT NULL, "description" varchar, "projectId" varchar, "version" varchar NOT NULL, "minimumSupportedRelease" varchar NOT NULL, "maximumSupportedRelease" varchar NOT NULL, "auth" text, "actions" text NOT NULL, "triggers" text NOT NULL, "pieceType" varchar, "packageType" varchar, CONSTRAINT "fk_piece_metadata_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_piece_metadata"("id", "created", "updated", "name", "displayName", "logoUrl", "description", "projectId", "version", "minimumSupportedRelease", "maximumSupportedRelease", "auth", "actions", "triggers") SELECT "id", "created", "updated", "name", "displayName", "logoUrl", "description", "projectId", "version", "minimumSupportedRelease", "maximumSupportedRelease", "auth", "actions", "triggers" FROM "piece_metadata"',
        )

        await queryRunner.query(
            'DROP INDEX "idx_piece_metadata_name_project_id_version"',
        )
        await queryRunner.query('DROP TABLE "piece_metadata"')

        await queryRunner.query(
            'UPDATE "temporary_piece_metadata" SET "pieceType" = \'OFFICIAL\' WHERE "projectId" IS NULL',
        )
        await queryRunner.query(
            'UPDATE "temporary_piece_metadata" SET "pieceType" = \'CUSTOM\' WHERE "projectId" IS NOT NULL',
        )
        await queryRunner.query(
            'UPDATE "temporary_piece_metadata" SET "packageType" = \'REGISTRY\'',
        )

        await queryRunner.query(
            'CREATE TABLE "temporary_piece_metadata_two" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "displayName" varchar NOT NULL, "logoUrl" varchar NOT NULL, "description" varchar, "projectId" varchar, "version" varchar NOT NULL, "minimumSupportedRelease" varchar NOT NULL, "maximumSupportedRelease" varchar NOT NULL, "auth" text, "actions" text NOT NULL, "triggers" text NOT NULL, "pieceType" varchar NOT NULL, "packageType" varchar NOT NULL, CONSTRAINT "fk_piece_metadata_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "temporary_piece_metadata_two"("id", "created", "updated", "name", "displayName", "logoUrl", "description", "projectId", "version", "minimumSupportedRelease", "maximumSupportedRelease", "auth", "actions", "triggers", "pieceType", "packageType") SELECT "id", "created", "updated", "name", "displayName", "logoUrl", "description", "projectId", "version", "minimumSupportedRelease", "maximumSupportedRelease", "auth", "actions", "triggers", "pieceType", "packageType" FROM "temporary_piece_metadata"',
        )

        await queryRunner.query('DROP TABLE "temporary_piece_metadata"')

        await queryRunner.query(
            'ALTER TABLE "temporary_piece_metadata_two" RENAME TO "piece_metadata"',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_piece_metadata_name_project_id_version" ON "piece_metadata" ("name", "version", "projectId") ',
        )

        logger.info('AddPieceTypeAndPackageTypeToPieceMetadata1696016228398: up')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP INDEX "idx_piece_metadata_name_project_id_version"',
        )
        await queryRunner.query(
            'ALTER TABLE "piece_metadata" RENAME TO "temporary_piece_metadata"',
        )
        await queryRunner.query(
            'CREATE TABLE "piece_metadata" ("id" varchar(21) PRIMARY KEY NOT NULL, "created" datetime NOT NULL DEFAULT (datetime(\'now\')), "updated" datetime NOT NULL DEFAULT (datetime(\'now\')), "name" varchar NOT NULL, "displayName" varchar NOT NULL, "logoUrl" varchar NOT NULL, "description" varchar, "projectId" varchar, "version" varchar NOT NULL, "minimumSupportedRelease" varchar NOT NULL, "maximumSupportedRelease" varchar NOT NULL, "auth" text, "actions" text NOT NULL, "triggers" text NOT NULL, CONSTRAINT "fk_piece_metadata_project_id" FOREIGN KEY ("projectId") REFERENCES "project" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)',
        )
        await queryRunner.query(
            'INSERT INTO "piece_metadata"("id", "created", "updated", "name", "displayName", "logoUrl", "description", "projectId", "version", "minimumSupportedRelease", "maximumSupportedRelease", "auth", "actions", "triggers") SELECT "id", "created", "updated", "name", "displayName", "logoUrl", "description", "projectId", "version", "minimumSupportedRelease", "maximumSupportedRelease", "auth", "actions", "triggers" FROM "temporary_piece_metadata"',
        )
        await queryRunner.query('DROP TABLE "temporary_piece_metadata"')
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_piece_metadata_name_project_id_version" ON "piece_metadata" ("name", "version", "projectId") ',
        )

        logger.info('AddPieceTypeAndPackageTypeToPieceMetadata1696016228398: down')
    }
}
