import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPieceMetadata1683573113419 implements MigrationInterface {
    name = 'AddPieceMetadata1683573113419'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE TABLE "piece-metadata" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "displayName" character varying NOT NULL, "logoUrl" character varying NOT NULL, "description" character varying NOT NULL, "actions" jsonb NOT NULL, "triggers" jsonb NOT NULL, "version" character varying NOT NULL, "minimumSupportedRelease" character varying, "maximumSupportedRelease" character varying, "projectId" character varying(21) NOT NULL, "tarFileId" character varying(21) NOT NULL, CONSTRAINT "PK_11428cdf0f38e2f2037dfd6abba" PRIMARY KEY ("id"))')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('DROP TABLE "piece-metadata"')
    }

}
