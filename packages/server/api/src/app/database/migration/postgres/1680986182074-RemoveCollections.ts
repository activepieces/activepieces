import { apId } from '@activepieces/shared'
import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class RemoveCollections1680986182074 implements MigrationInterface {
    name = 'RemoveCollections1680986182074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('Running RemoveCollections1680986182074 migration')
        // Data Queries
        await queryRunner.query(`
        UPDATE "store-entry"
        SET "collectionId" = "collection"."projectId"
        FROM "collection"
        WHERE "store-entry"."collectionId" = "collection"."id";
        `)
        await queryRunner.query(
            'CREATE TABLE "folder" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "displayName" character varying NOT NULL, "projectId" character varying(21) NOT NULL, CONSTRAINT "PK_6278a41a706740c94c02e288df8" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_folder_project_id" ON "folder" ("projectId") ',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" ADD "folderId" character varying(21)',
        )

        let countFolders = 0
        const collections = await queryRunner.query('SELECT * FROM "collection"')
        for (const collection of collections) {
            const randomId = apId()
            await queryRunner.query(
                'INSERT INTO "folder" ("id", "created", "updated", "displayName", "projectId") VALUES ($1, NOW(), NOW(), $2, $3)',
                [randomId, collection.displayName, collection.projectId],
            )
            await queryRunner.query(
                `UPDATE "flow" SET "folderId" = '${randomId}' WHERE "collectionId" = '${collection.id}'`,
            )
            countFolders++
        }
        log.info(
            `RemoveCollections1680986182074 Migrated ${countFolders} folders`,
        )
        // Schema Queries
        await queryRunner.query(
            'ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_collection_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_collection_id"',
        )
        await queryRunner.query('DROP INDEX "idx_flow_collection_id"')
        await queryRunner.query(
            'ALTER TABLE "store-entry" RENAME COLUMN "collectionId" TO "projectId"',
        )
        await queryRunner.query(
            'CREATE TABLE "flow_instance" ("id" character varying(21) NOT NULL, "created" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "projectId" character varying(21) NOT NULL, "flowId" character varying(21) NOT NULL, "flowVersionId" character varying(21) NOT NULL, "status" character varying NOT NULL, CONSTRAINT "REL_cb897f5e48cc3cba1418966326" UNIQUE ("flowId"), CONSTRAINT "REL_ec72f514c21734fb7a08797d75" UNIQUE ("flowVersionId"), CONSTRAINT "PK_5b0308060b7de5abec61ac5d2db" PRIMARY KEY ("id"))',
        )
        await queryRunner.query(
            'CREATE UNIQUE INDEX "idx_flow_instance_project_id_flow_id" ON "flow_instance" ("projectId", "flowId") ',
        )
        await queryRunner.query('ALTER TABLE "flow" DROP COLUMN "collectionId"')
        await queryRunner.query(
            'ALTER TABLE "flow_run" DROP COLUMN "collectionId"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" DROP COLUMN "collectionDisplayName"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_project_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" ALTER COLUMN "projectId" SET NOT NULL',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_project_id" ON "flow" ("projectId") ',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_folder_id" ON "flow" ("folderId") ',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_instance" ADD CONSTRAINT "fk_flow_instance_flow" FOREIGN KEY ("flowId") REFERENCES "flow"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_instance" ADD CONSTRAINT "fk_flow_instance_flow_version" FOREIGN KEY ("flowVersionId") REFERENCES "flow_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" ADD CONSTRAINT "fk_flow_folder_id" FOREIGN KEY ("folderId") REFERENCES "folder"("id") ON DELETE SET NULL ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" ADD CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "folder" ADD CONSTRAINT "fk_folder_project" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )

        // Migrate Flow Instances
        const instances = await queryRunner.query('SELECT * FROM "instance"')
        let count = 0
        let failed = 0
        for (const instance of instances) {
            const flowIdToVersionId = instance.flowIdToVersionId
            for (const flowId of Object.keys(flowIdToVersionId)) {
                const flowVersionId = flowIdToVersionId[flowId]
                const randomId = apId()

                const flowExists = await queryRunner.query(
                    `SELECT EXISTS(SELECT 1 FROM "flow" WHERE "id" = '${flowId}')`,
                )
                const flowVersionExists = await queryRunner.query(
                    `SELECT EXISTS(SELECT 1 FROM "flow_version" WHERE "id" = '${flowVersionId}')`,
                )
                if (!flowExists[0].exists || !flowVersionExists[0].exists) {
                    failed++
                    log.info(
                        `Skipping flow instance ${instance.id} because flow ${flowId} or flow version ${flowVersionId} does not exist`,
                    )
                }
                else {
                    await queryRunner.query(
                        `INSERT INTO "flow_instance" ("id", "created", "updated", "projectId", "flowId", "flowVersionId", "status") VALUES ('${randomId}', 'NOW()', 'NOW()', '${instance.projectId}', '${flowId}', '${flowVersionId}', '${instance.status}')`,
                    )
                    count++
                }
            }
        }

        log.info(
            `Finished Running RemoveCollections1680986182074 migration with ${count} flow instances migrated and ${failed} failed`,
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    // Schema Queries
        await queryRunner.query(
            'ALTER TABLE "folder" DROP CONSTRAINT "fk_folder_project"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_project_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" DROP CONSTRAINT "fk_flow_folder_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_instance" DROP CONSTRAINT "fk_flow_instance_flow_version"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_instance" DROP CONSTRAINT "fk_flow_instance_flow"',
        )
        await queryRunner.query('DROP INDEX "idx_flow_folder_id"')
        await queryRunner.query('DROP INDEX "idx_flow_project_id"')
        await queryRunner.query(
            'ALTER TABLE "flow" ALTER COLUMN "projectId" DROP NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" ADD CONSTRAINT "fk_flow_project_id" FOREIGN KEY ("projectId") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query('ALTER TABLE "flow" DROP COLUMN "folderId"')
        await queryRunner.query(
            'ALTER TABLE "flow_run" ADD "collectionDisplayName" character varying NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" ADD "collectionId" character varying(21) NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" ADD "collectionId" character varying(21) NOT NULL',
        )
        await queryRunner.query('DROP INDEX "idx_folder_project_id"')
        await queryRunner.query('DROP TABLE "folder"')
        await queryRunner.query(
            'DROP INDEX "idx_flow_instance_project_id_flow_id"',
        )
        await queryRunner.query('DROP TABLE "flow_instance"')
        await queryRunner.query(
            'ALTER TABLE "store-entry" RENAME COLUMN "projectId" TO "collectionId"',
        )
        await queryRunner.query(
            'CREATE INDEX "idx_flow_collection_id" ON "flow" ("collectionId") ',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" ADD CONSTRAINT "fk_flow_run_collection_id" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "flow" ADD CONSTRAINT "fk_flow_collection_id" FOREIGN KEY ("collectionId") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        // Data queries
        await queryRunner.query(`
        UPDATE "store-entry"
        SET "collectionId" = "collection"."id"
        FROM "collection"
        WHERE "store-entry"."collectionId" = "collection"."projectId";`)
    }
}
