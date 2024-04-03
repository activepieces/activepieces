import { MigrationInterface, QueryRunner } from 'typeorm'
import { logger } from '@activepieces/server-shared'

export class initializeSchema1676238396411 implements MigrationInterface {
    name = 'initializeSchema1676238396411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info('initializeSchema1676238396411: started')

        const userTableExistsQueryResponse: { exists: boolean }[] =
      await queryRunner.query(
          `SELECT exists (
            SELECT FROM information_schema.tables
              WHERE  table_schema = 'public'
              AND    table_name   = 'user'
          )`,
      )

        const userTableExists =
      userTableExistsQueryResponse &&
      userTableExistsQueryResponse.length > 0 &&
      userTableExistsQueryResponse[0].exists

        if (userTableExists) {
            logger.info('initializeSchema1676238396411: skipped')
            return
        }

        await queryRunner.query(
            'CREATE TABLE "collection" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "projectId" character varying(21) NOT NULL, CONSTRAINT "PK_ad3f485bbc99d875491f44d7c85" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_collection_project_id" ON "collection" ("projectId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "collection_version" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "displayName" character varying NOT NULL, "collectionId" character varying(21) NOT NULL, "configs" jsonb NOT NULL, "state" character varying NOT NULL, CONSTRAINT "PK_76c769e96c091b478e3c338a0ac" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_collection_version_collection_id" ON "collection_version" ("collectionId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "file" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "projectId" character varying(21), "data" bytea NOT NULL, CONSTRAINT "PK_36b46d232307066b3a2c9ea3a1d" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE TABLE "flag" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "value" jsonb NOT NULL, CONSTRAINT "PK_17b74257294fdfd221178a132d4" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE TABLE "flow" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "projectId" character varying(21), "collectionId" character varying(21) NOT NULL, CONSTRAINT "PK_6c2ad4a3e86394cd9bb7a80a228" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_collection_id" ON "flow" ("collectionId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "flow_version" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "flowId" character varying(21) NOT NULL, "displayName" character varying NOT NULL, "trigger" jsonb, "valid" boolean NOT NULL, "state" character varying NOT NULL, CONSTRAINT "PK_2f20a52dcddf98d3fafe621a9f5" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_version_flow_id" ON "flow_version" ("flowId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "instance" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "projectId" character varying(21) NOT NULL, "collectionId" character varying(21) NOT NULL, "collectionVersionId" character varying(21) NOT NULL, "flowIdToVersionId" jsonb NOT NULL, "status" character varying NOT NULL, CONSTRAINT "REL_183c020130aa172f58c6a0c647" UNIQUE ("collectionVersionId"), CONSTRAINT "REL_6b75536fbdf7d8dc967fc350ff" UNIQUE ("collectionId"), CONSTRAINT "PK_eaf60e4a0c399c9935413e06474" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_instance_project_id" ON "instance" ("projectId") ',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_instance_collection_id" ON "instance" ("collectionId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "flow_run" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "projectId" character varying(21) NOT NULL, "flowId" character varying(21) NOT NULL, "collectionId" character varying(21) NOT NULL, "flowVersionId" character varying(21) NOT NULL, "collectionVersionId" character varying(21) NOT NULL, "environment" character varying, "flowDisplayName" character varying NOT NULL, "collectionDisplayName" character varying NOT NULL, "logsFileId" character varying(21), "status" character varying NOT NULL, "startTime" TIMESTAMP WITH TIME ZONE NOT NULL, "finishTime" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_858b1dd0d1055c44261ae00d45b" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_run_project_id" ON "flow_run" ("projectId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "project" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "ownerId" character varying(21) NOT NULL, "displayName" character varying NOT NULL, CONSTRAINT "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_project_owner_id" ON "project" ("ownerId") ',
        )
        await queryRunner.query(
            'CREATE TABLE "store-entry" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "key" character varying NOT NULL, "collectionId" character varying(21) NOT NULL, "value" jsonb NOT NULL, CONSTRAINT "PK_afb44ca7c0b4606b19deb1680d6" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE TABLE "user" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "password" character varying NOT NULL, "status" character varying NOT NULL, "trackEvents" boolean, "newsLetter" boolean, CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE TABLE "app_connection" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "appName" character varying NOT NULL, "projectId" character varying(21) NOT NULL, "value" jsonb NOT NULL, CONSTRAINT "PK_9efa2d6633ecc57cc5adeafa039" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_connection_project_id_and_app_name_and_name" ON "app_connection" ("projectId", "appName", "name") ',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_app_connection_project_id_and_name" ON "app_connection" ("projectId", "name") ',
        )
        await queryRunner.query(
            'ALTER TABLE "collection" ADD CONSTRAINT "fk_collection_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "collection_version" ADD CONSTRAINT "fk_collection_version_collection_id" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "file" ADD CONSTRAINT "fk_file_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" ADD CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" ADD CONSTRAINT "fk_flow_collection_id" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_version" ADD CONSTRAINT "fk_flow_version_flow" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "instance" ADD CONSTRAINT "fk_instance_collection_version" FOREIGN KEY ("collectionVersionId") REFERENCES "collection_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "instance" ADD CONSTRAINT "fk_instance_collection" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" ADD CONSTRAINT "fk_flow_run_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" ADD CONSTRAINT "fk_flow_run_flow_id" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" ADD CONSTRAINT "fk_flow_run_collection_id" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" ADD CONSTRAINT "fk_flow_run_collection_version_id" FOREIGN KEY ("collectionVersionId") REFERENCES "collection_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "project" ADD CONSTRAINT "fk_project_owner_id" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "app_connection" ADD CONSTRAINT "fk_app_connection_app_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )

        logger.info('initializeSchema1676238396411: completed')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "app_connection" DROP CONSTRAINT "fk_app_connection_app_project_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "project" DROP CONSTRAINT "fk_project_owner_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_collection_version_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_collection_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_flow_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_project_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "instance" DROP CONSTRAINT "fk_instance_collection"',
        )
        await queryRunner.query(
            'ALTER TABLE "instance" DROP CONSTRAINT "fk_instance_collection_version"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_version" DROP CONSTRAINT "fk_flow_version_flow"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_collection_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_project_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "file" DROP CONSTRAINT "fk_file_project_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "collection_version" DROP CONSTRAINT "fk_collection_version_collection_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "collection" DROP CONSTRAINT "fk_collection_project_id"',
        )
        await queryRunner.query(
            'DROP INDEX "public"."idx_app_connection_project_id_and_name"',
        )
        await queryRunner.query(
            'DROP INDEX "public"."idx_app_connection_project_id_and_app_name_and_name"',
        )
        await queryRunner.query('DROP TABLE "app_connection"')
        await queryRunner.query('DROP TABLE "user"')
        await queryRunner.query('DROP TABLE "store-entry"')
        await queryRunner.query('DROP INDEX "public"."idx_project_owner_id"')
        await queryRunner.query('DROP TABLE "project"')
        await queryRunner.query('DROP INDEX "public"."idx_run_project_id"')
        await queryRunner.query('DROP TABLE "flow_run"')
        await queryRunner.query('DROP INDEX "public"."idx_instance_collection_id"')
        await queryRunner.query('DROP INDEX "public"."idx_instance_project_id"')
        await queryRunner.query('DROP TABLE "instance"')
        await queryRunner.query('DROP INDEX "public"."idx_flow_version_flow_id"')
        await queryRunner.query('DROP TABLE "flow_version"')
        await queryRunner.query('DROP INDEX "public"."idx_flow_collection_id"')
        await queryRunner.query('DROP TABLE "flow"')
        await queryRunner.query('DROP TABLE "flag"')
        await queryRunner.query('DROP TABLE "file"')
        await queryRunner.query(
            'DROP INDEX "public"."idx_collection_version_collection_id"',
        )
        await queryRunner.query('DROP TABLE "collection_version"')
        await queryRunner.query('DROP INDEX "public"."idx_collection_project_id"')
        await queryRunner.query('DROP TABLE "collection"')
    }
}
