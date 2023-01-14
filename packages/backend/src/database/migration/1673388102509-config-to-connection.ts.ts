import { apId } from "shared";
import { MigrationInterface, QueryRunner } from "typeorm"

export class configToConnection1673388102509 implements MigrationInterface {

    async up(queryRunner: QueryRunner): Promise<any> {
        console.log("Running config to connection migeration");
        const collectionVersionRepo = queryRunner.connection.getRepository("collection_version");
        const collectionRepo = queryRunner.connection.getRepository("collection");
        const appConnectionRepo = queryRunner.connection.getRepository("app_connection");
        const flowVersionRepo = queryRunner.connection.getRepository("flow_version");

        const versions = await collectionVersionRepo.find({});
        for (let i = 0; i < versions.length; ++i) {
            const collectionVersion = versions[i];
            const projectId = (await collectionRepo.findOneBy({ id: collectionVersion.collectionId }))!.projectId;
            const configs = collectionVersion.configs;
            for (let j = 0; j < configs.length; ++j) {
                const config: {
                    type: "OAUTH2" | "CLOUD_AUTH2",
                    key: string;
                    value: any;
                    settings: {
                        clientId: string;
                        clientSecret: string;
                        tokenUrl: string;
                        redirectUrl: string;
                        pieceName: string | null;
                    }
                } = configs[i];
                switch (config.type) {
                    case "OAUTH2":
                        await appConnectionRepo.upsert({
                            id: apId(),
                            appName: config.settings.pieceName,
                            name: config.key,
                            projectId: projectId,
                            value: {
                                type: "OAUTH2",
                                ...config.value,
                                client_id: config.settings.clientId,
                                client_secret: config.settings.clientSecret,
                                token_url: config.settings.tokenUrl,
                                redirect_url: config.settings.redirectUrl
                            }
                        }, ["name", "projectId"]);
                        break;
                    case "CLOUD_AUTH2":
                        await appConnectionRepo.upsert({
                            id: apId(),
                            appName: config.settings.pieceName,
                            name: config.key,
                            projectId: projectId,
                            value: {
                                type: "CLOUD_OAUTH2",
                                ...config.value
                            },
                        }, ["name", "projectId"]);
                        break;
                    default:
                        break;
                }
            }
        }

        for (let i = 0; i < versions.length; ++i) {
            const collectionVersion = versions[i] as {
                id: string;
                configs: any[]
            };
            collectionVersion.configs = collectionVersion.configs.filter(f => f.type !== "OAUTH2" && f.type !== "CLOUD_OAUTH2" && f.type !== "CLOUD_AUTH2");
            await collectionVersionRepo.update(collectionVersion.id, collectionVersion);
        }
        const flowVersions = await flowVersionRepo.find();
        for (let i = 0; i < flowVersions.length; ++i) {
            let flowVersion = flowVersions[i];
            let changed = false;
            let triggerOrAction = flowVersion.trigger;
            while (triggerOrAction != null) {
                let input = triggerOrAction.settings?.input?.authentication;
                if (input !== undefined) {
                    input = (input as string).replace("configs.", "connections.");
                    changed = true;
                }
                triggerOrAction = triggerOrAction.nextAction;
            }
            if (changed) {
                flowVersionRepo.update(flowVersion.id, flowVersion);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
