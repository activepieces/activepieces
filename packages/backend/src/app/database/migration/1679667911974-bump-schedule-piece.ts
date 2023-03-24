import { MigrationInterface, QueryRunner } from "typeorm"
import { logger } from "../../helper/logger";

const FLOW_VERSION_TABLE = "flow_version";

export class bumpSchedulePiece1679667911974 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        logger.info("bumpSchedulePiece1679667911974, started");

        let count = 0;
        const flowVersionRepo = queryRunner.connection.getRepository(FLOW_VERSION_TABLE);
        const flowVersions = await flowVersionRepo.find();

        for (const flowVersion of flowVersions) {
            const step = flowVersion.trigger;
            if (step.type === "PIECE_TRIGGER") {
                if (step.settings.pieceName === "schedule") {
                    step.type = "PIECE_TRIGGER";
                    step.settings = {
                        input: {
                            cronExpression: step.settings.cronExpression
                        },
                        triggerName: "cron_expression",
                        pieceName: "schedule",
                        pieceVersion: "0.0.2",
                    }
                    count++;
                    await flowVersionRepo.update(flowVersion.id, flowVersion);
                }
            }
        }
        logger.info("bumpSchedulePiece1679667911974, finished flows " + count);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Ignored
    }

}
