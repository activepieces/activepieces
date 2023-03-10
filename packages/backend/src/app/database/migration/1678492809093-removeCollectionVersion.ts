import { MigrationInterface, QueryRunner } from "typeorm";

export class removeCollectionVersion1678492809093 implements MigrationInterface {
    name = 'removeCollectionVersion1678492809093'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log("Running migration removeCollectionVersion1678492809093");
        await queryRunner.query(`ALTER TABLE "instance" DROP CONSTRAINT "fk_instance_collection_version"`);
        await queryRunner.query(`ALTER TABLE "flow_run" DROP CONSTRAINT "fk_flow_run_collection_version_id"`);
        await queryRunner.query(`ALTER TABLE "instance" DROP CONSTRAINT "REL_183c020130aa172f58c6a0c647"`);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "collectionVersionId"`);
        await queryRunner.query(`ALTER TABLE "flow_run" DROP COLUMN "collectionVersionId"`);
        await queryRunner.query(`ALTER TABLE "collection" ADD "displayName" character varying`);

        await queryRunner.commitTransaction();
        await queryRunner.startTransaction();
        const collectionRepo = queryRunner.connection.getRepository("collection");
        const collectionVersionRepo = queryRunner.connection.getRepository("collection_version");
        const collections = await collectionRepo.find({});
        for (let i = 0; i < collections.length; ++i) {
            const currentCollection = collections[i];

            const latestCollectionVersion = await collectionVersionRepo.findOne({
                where: {
                    collectionId: currentCollection.id,
                },
                order: {
                    created: "DESC",
                },
            })
            currentCollection.displayName = latestCollectionVersion.displayName;
            await collectionRepo.update(currentCollection.id, currentCollection);
        }
        console.log("Finished migration removeCollectionVersion1678492809093");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "displayName"`);
        await queryRunner.query(`ALTER TABLE "flow_run" ADD "collectionVersionId" character varying(21) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "instance" ADD "collectionVersionId" character varying(21) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "instance" ADD CONSTRAINT "REL_183c020130aa172f58c6a0c647" UNIQUE ("collectionVersionId")`);
        await queryRunner.query(`ALTER TABLE "flow_run" ADD CONSTRAINT "fk_flow_run_collection_version_id" FOREIGN KEY ("collectionVersionId") REFERENCES "collection_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "instance" ADD CONSTRAINT "fk_instance_collection_version" FOREIGN KEY ("collectionVersionId") REFERENCES "collection_version"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
