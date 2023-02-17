import { MigrationInterface, QueryRunner } from "typeorm"

export class removeStoreAction1676649852890 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const flowVersionRepo = queryRunner.connection.getRepository("flow_version");
        const flowVersions = await flowVersionRepo.find({});
        for (let i = 0; i < flowVersions.length; ++i) {
            const currentFlowVersion = flowVersions[i];
            let action = currentFlowVersion.trigger?.nextAction;
            while (action !== undefined && action !== null) {
                if (action.type === "SOTRAGE") {
                    action.type = "PIECE";
                    const operation = action.setings.operation === 'GET' ? 'get' : 'put';
                    const key = action.settings.key;
                    const value = action.settings.value;
                    action.settings = {
                        pieceName: "storage",
                        actionName: operation,
                        input: {
                            key,
                            value
                        },
                        inputUiInfo: {}
                    }
                }
                action = action.nextAction;
            }

            
            await flowVersionRepo.update(currentFlowVersion.id, currentFlowVersion);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const flowVersionRepo = queryRunner.connection.getRepository("flow_version");
        const flowVersions = await flowVersionRepo.find({});
        for (let i = 0; i < flowVersions.length; ++i) {
            const currentFlowVersion = flowVersions[i];
            let action = currentFlowVersion.trigger?.nextAction;
            while (action !== undefined && action !== null) {
                if (action.type === "PIECE" && action.settings.pieceName === "storage") {
                    action.type = "STORAGE";
                    action.settings = {
                        operation: action.setings.operation.toUpperCase(),
                        key: action.settings.key,
                        value: action.settings.value
                    }
                }
                action = action.nextAction;
            }
            await flowVersionRepo.update(currentFlowVersion.id, currentFlowVersion);
        }
    }

}
