import { MigrationInterface, QueryRunner } from "typeorm"
import { logger } from "../../helper/logger";

const FLOW_VERSION_TABLE = "flow_version";
const PIECE_TYPE = "PIECE";
const PIECE_TRIGGER_TYPE = "PIECE_TRIGGER";
const BRANCH_TYPE = "BRANCH";

export class bumpFixPieceVersions1678928503715 implements MigrationInterface {


    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info("bumpFixPieceVersions1678928503715, started");

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

        logger.info("bumpFixPieceVersions1678928503715, finished bumping " + count + " flows");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Ignored
    }

}

function updateStep(step) {
    let update = false;
    while (step) {
        if (step.type === PIECE_TYPE || step.type === PIECE_TRIGGER_TYPE) {
            if (step.settings.pieceName === 'google_sheets') {
                step.settings.pieceName = "google-sheets";
            }
            if (step.settings.pieceName === 'google_calendar') {
                step.settings.pieceName = "google-calendar";
            }
            if (step.settings.pieceName === 'google_contacts') {
                step.settings.pieceName = "google-contacts";
            }
            if (step.settings.pieceName === 'google_drive') {
                step.settings.pieceName = "google-drive";
            }
            if (step.settings.pieceName === 'google_tasks') {
                step.settings.pieceName = "google-tasks";
            }
            if (step.settings.pieceName === 'cal.com') {
                step.settings.pieceName = "cal-com";
            }
            if (step.settings.pieceName === 'storage') {
                step.settings.pieceName = "store";
            }
            if (step.settings.pieceName === 'telegram_bot') {
                step.settings.pieceName = "telegram-bot";
            }      
            if (step.settings.pieceName === 'youtube') {
                // Youtube latest version is 0.1.4
                step.settings.pieceVersion = "0.1.4";
            }
            else {
                step.settings.pieceVersion = "0.1.3";
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

