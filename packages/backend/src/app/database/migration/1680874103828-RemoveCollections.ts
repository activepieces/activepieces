import { MigrationInterface, QueryRunner } from 'typeorm'

export class RemoveCollections1680874103828 implements MigrationInterface {
    name = 'RemoveCollections1680874103828'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_collection_id"')
        await queryRunner.query('ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_collection_id"')
        await queryRunner.query('DROP INDEX "public"."idx_flow_collection_id"')
        await queryRunner.query('ALTER TABLE "store-entry" RENAME COLUMN "collectionId" TO "projectId"')
        await queryRunner.query('CREATE TABLE "flow_instance" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "projectId" character varying(21) NOT NULL, "flowId" character varying(21) NOT NULL, "flowVersionId" character varying(21) NOT NULL, "status" character varying NOT NULL, CONSTRAINT "PK_5b0308060b7de5abec61ac5d2db" PRIMARY KEY ("id"))')
        await queryRunner.query('CREATE INDEX "idx_flow_instance_project_id_flow_id" ON "flow_instance" ("projectId", "flowId") ')
        await queryRunner.query('ALTER TABLE "flow" DROP COLUMN "collectionId"')
        await queryRunner.query('ALTER TABLE "flow_run" DROP COLUMN "collectionId"')
        await queryRunner.query('ALTER TABLE "flow_run" DROP COLUMN "collectionDisplayName"')
        await queryRunner.query('CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId") ')
        await queryRunner.query('ALTER TABLE "flow_instance" ADD CONSTRAINT "fk_flow_instance_flow" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION')
        await queryRunner.query('ALTER TABLE "flow_instance" ADD CONSTRAINT "fk_flow_instance_flow_version" FOREIGN KEY ("flowVersionId") REFERENCES "flow_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION')
        // TODO migrate store entries
        // TODO migrate folders
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE "flow_instance" DROP CONSTRAINT "fk_flow_instance_flow_version"')
        await queryRunner.query('ALTER TABLE "flow_instance" DROP CONSTRAINT "fk_flow_instance_flow"')
        await queryRunner.query('DROP INDEX "public"."idx_flow_project_id"')
        await queryRunner.query('ALTER TABLE "flow_run" ADD "collectionDisplayName" character varying NOT NULL')
        await queryRunner.query('ALTER TABLE "flow_run" ADD "collectionId" character varying(21) NOT NULL')
        await queryRunner.query('ALTER TABLE "flow" ADD "collectionId" character varying(21) NOT NULL')
        await queryRunner.query('DROP INDEX "public"."idx_flow_instance_project_id_flow_id"')
        await queryRunner.query('DROP TABLE "flow_instance"')
        await queryRunner.query('ALTER TABLE "store-entry" RENAME COLUMN "projectId" TO "collectionId"')
        await queryRunner.query('CREATE INDEX "idx_flow_collection_id" ON "flow" ("collectionId") ')
        await queryRunner.query('ALTER TABLE "flow_run" ADD CONSTRAINT "fk_flow_run_collection_id" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE NO ACTION')
        await queryRunner.query('ALTER TABLE "flow" ADD CONSTRAINT "fk_flow_collection_id" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE NO ACTION')
    }

}
