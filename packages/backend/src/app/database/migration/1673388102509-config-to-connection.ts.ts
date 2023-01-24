import { MigrationInterface, QueryRunner } from "typeorm"

export class configToConnection1673388102509 implements MigrationInterface {

    async up(queryRunner: QueryRunner): Promise<any> {
        console.log("Running config to connection migeration");
        const collectionVersionRepo = queryRunner.connection.getRepository("collection_version");
        const versions = await collectionVersionRepo.find({});

        for (let i = 0; i < versions.length; ++i) {
            const collectionVersion = versions[i] as {
                id: string;
                configs: any[]
            };
            collectionVersion.configs = collectionVersion.configs.filter(f => f.type !== "OAUTH2" && f.type !== "CLOUD_OAUTH2" && f.type !== "CLOUD_AUTH2");
            await collectionVersionRepo.update(collectionVersion.id, collectionVersion);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {}

}
