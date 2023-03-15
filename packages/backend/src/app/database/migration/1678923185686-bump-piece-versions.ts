import { MigrationInterface, QueryRunner } from "typeorm"
import { logger } from "../../helper/logger";

const FLOW_VERSION_TABLE = "flow_version";
const PIECE_TYPE = "PIECE";
const BRANCH_TYPE = "BRANCH";

export class bumpPieceVersions1678923185686 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info("bumpPieceVersions1678923185686, started");

        let count = 0;
        const flowVersionRepo = queryRunner.connection.getRepository(FLOW_VERSION_TABLE);
        const flowVersions = await flowVersionRepo.find();

        for (const flowVersion of flowVersions) {
            const step = flowVersion.trigger;
            const update = updateStep(step);
            if (update) {
                count++;
                await flowVersionRepo.update(flowVersion.id, flowVersion);
            }
        }

        logger.info("bumpPieceVersions1678923185686, finished bumping " + count + " flows");
    }

    public async down(queryRunner: QueryRunner): Promise<void> { 
        // Ignored
    }

}

function updateStep(step) {
    let update = false;
    while (step) {
        if (step.type === PIECE_TYPE) {
            if (step.settings.pieceName === 'youtube') {
                // Youtube latest version is 0.1.3
                step.settings.pieceVersion = "0.1.3";
            }
            else {
                step.settings.pieceVersion = "0.1.2";
            }
            update = true;
        }
        if (step.type === BRANCH_TYPE) {
            if (step.onSuccessAction) {
                update = update || updateStep(step.onSuccessAction);
            }
            if (step.onFailureAction) {
                update = update || updateStep(step.onFailureAction);
            }
        }

        step = step.nextAction;
    }
    return update;
}

