import { MigrationInterface, QueryRunner } from 'typeorm'
import { system } from '../../../helper/system/system'

const log = system.globalLogger()

export class removeCollectionVersion1678492809093
implements MigrationInterface {
    name = 'removeCollectionVersion1678492809093'

    public async up(queryRunner: QueryRunner): Promise<void> {
        log.info('Running migration removeCollectionVersion1678492809093')
        await queryRunner.query(
            'ALTER TABLE "instance" DROP CONSTRAINT "fk_instance_collection_version"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_collection_version_id"',
        )
        await queryRunner.query(
            'ALTER TABLE "instance" DROP CONSTRAINT "REL_183c020130aa172f58c6a0c647"',
        )
        await queryRunner.query(
            'ALTER TABLE "instance" DROP COLUMN "collectionVersionId"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" DROP COLUMN "collectionVersionId"',
        )
        await queryRunner.query(
            'ALTER TABLE "collection" ADD "displayName" character varying',
        )
        const collections = await queryRunner.query(
            'SELECT * FROM collection',
        )

        for (let i = 0; i < collections.length; ++i) {
            let currentCollection = collections[i]
            const latestCollectionVersionQuery = `
                SELECT * FROM collection_version
                WHERE "collectionId" = '${currentCollection.id}'
                ORDER BY created DESC
                LIMIT 1
            `
            const [latestCollectionVersion] = await queryRunner.query(
                latestCollectionVersionQuery,
            )

            let displayName = 'Untitled'
            if (latestCollectionVersion) {
                displayName = latestCollectionVersion.displayName
            }

            currentCollection = {
                ...currentCollection,
                displayName,
            }

            const updateCollectionQuery = `
                UPDATE collection
                SET displayName = '${displayName}'
                WHERE id = '${currentCollection.id}'
            `
            await queryRunner.query(updateCollectionQuery)
        }
        log.info('Finished migration removeCollectionVersion1678492809093')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE "collection" DROP COLUMN "displayName"',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" ADD "collectionVersionId" character varying(21) NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "instance" ADD "collectionVersionId" character varying(21) NOT NULL',
        )
        await queryRunner.query(
            'ALTER TABLE "instance" ADD CONSTRAINT "REL_183c020130aa172f58c6a0c647" UNIQUE ("collectionVersionId")',
        )
        await queryRunner.query(
            'ALTER TABLE "flow_run" ADD CONSTRAINT "fk_flow_run_collection_version_id" FOREIGN KEY ("collectionVersionId") REFERENCES "collection_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
        await queryRunner.query(
            'ALTER TABLE "instance" ADD CONSTRAINT "fk_instance_collection_version" FOREIGN KEY ("collectionVersionId") REFERENCES "collection_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
        )
    }
}
