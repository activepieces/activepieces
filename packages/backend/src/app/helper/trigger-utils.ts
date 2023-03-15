import { Trigger } from "@activepieces/framework";
import {
    CollectionId,
    ExecuteTriggerResponse,
    FlowVersion,
    PieceTrigger,
    ProjectId,
    RunEnvironment,
    TriggerHookType,
    TriggerType,
    TriggerStrategy,
} from "@activepieces/shared";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { flowQueue } from "../workers/flow-worker/flow-queue";
import { engineHelper } from "./engine-helper";
import { logger } from "../helper/logger";
import { getPiece } from "@activepieces/pieces-apps";
import { webhookService } from "../webhooks/webhook-service";
import { appEventRoutingService } from "../app-event-routing/app-event-routing.service";

const EVERY_FIVE_MINUTES = "*/5 * * * *";

export const triggerUtils = {
    async executeTrigger({ payload, flowVersion, projectId, collectionId}: ExecuteTrigger): Promise<unknown[]> {
        const flowTrigger = flowVersion.trigger;
        let payloads = [];
        switch (flowTrigger.type) {
        case TriggerType.PIECE: {
            const pieceTrigger = getPieceTrigger(flowTrigger);
            try {
                payloads = await engineHelper.executeTrigger({
                    hookType: TriggerHookType.RUN,
                    flowVersion: flowVersion,
                    triggerPayload: payload,
                    collectionId,
                    webhookUrl: await webhookService.getWebhookUrl(flowVersion.flowId),
                    projectId: projectId
                }) as unknown[];
            }
            catch (e) {
                logger.error(`Flow ${flowTrigger.name} with ${pieceTrigger.name} trigger throws and error, returning as zero payload `);
                payloads = [];
            }
            break;
        }
        default:
            payloads = [payload];
            break;
        }
        return payloads;
    },

    async enable({ collectionId, flowVersion, projectId }: EnableOrDisableParams): Promise<void> {
        switch (flowVersion.trigger.type) {
        case TriggerType.PIECE:
            await enablePieceTrigger({ collectionId, projectId, flowVersion });
            break;

        case TriggerType.SCHEDULE:
            console.log("Created Schedule for flow version Id " + flowVersion.id);

            await flowQueue.add({
                id: flowVersion.id,
                data: {
                    environment: RunEnvironment.PRODUCTION,
                    projectId: projectId,
                    collectionId,
                    flowVersion,
                    triggerType: TriggerType.SCHEDULE,
                },
                cronExpression: flowVersion.trigger.settings.cronExpression,
            });

            break;
        default:
            break;
        }
    },

    async disable({ collectionId, flowVersion, projectId }: EnableOrDisableParams): Promise<void> {
        switch (flowVersion.trigger.type) {
        case TriggerType.PIECE:
            await disablePieceTrigger({ collectionId, projectId, flowVersion });
            break;

        case TriggerType.SCHEDULE:
            console.log("Deleted Schedule for flow version Id " + flowVersion.id);
            await flowQueue.removeRepeatableJob({
                id: flowVersion.id
            });
            break;

        default:
            break;
        }
    },
};

const disablePieceTrigger = async ({ flowVersion, projectId, collectionId }: EnableOrDisableParams): Promise<void> => {
    const flowTrigger = flowVersion.trigger as PieceTrigger;
    const pieceTrigger = getPieceTrigger(flowTrigger);
    await engineHelper.executeTrigger({
        hookType: TriggerHookType.ON_DISABLE,
        flowVersion: flowVersion,
        collectionId,
        webhookUrl: await webhookService.getWebhookUrl(flowVersion.flowId),
        projectId: projectId
    });
    switch (pieceTrigger.type) {
    case TriggerStrategy.APP_WEBHOOK:
        await appEventRoutingService.deleteListeners({projectId, flowId: flowVersion.flowId });
        break;
    case TriggerStrategy.WEBHOOK:
        break;
    case TriggerStrategy.POLLING:
        await flowQueue.removeRepeatableJob({
            id: flowVersion.id,
        });
        break;
    }
};

const enablePieceTrigger = async ({ flowVersion, projectId, collectionId }: EnableOrDisableParams): Promise<void> => {
    const flowTrigger = flowVersion.trigger as PieceTrigger;
    const pieceTrigger = getPieceTrigger(flowTrigger);

    const response = await engineHelper.executeTrigger({
        hookType: TriggerHookType.ON_ENABLE,
        flowVersion: flowVersion,
        collectionId,
        webhookUrl: await webhookService.getWebhookUrl(flowVersion.flowId),
        projectId: projectId
    });
    switch (pieceTrigger.type) {
    case TriggerStrategy.APP_WEBHOOK: {
        const appName = flowTrigger.settings.pieceName;
        const listeners = (response as ExecuteTriggerResponse).listeners;
        for(const listener of listeners){
            await appEventRoutingService.createListeners({projectId, flowId: flowVersion.flowId, appName, events: listener.events, identifierValue: listener.identifierValue });
        }
    }
        break;
    case TriggerStrategy.WEBHOOK:
        break;
    case TriggerStrategy.POLLING:
        await flowQueue.add({
            id: flowVersion.id,
            data: {
                projectId,
                environment: RunEnvironment.PRODUCTION,
                collectionId,
                flowVersion,
                triggerType: TriggerType.PIECE,
            },
            cronExpression: EVERY_FIVE_MINUTES,
        });

        break;
    }
};

const getPieceTrigger = (trigger: PieceTrigger): Trigger => {
    const piece = getPiece(trigger.settings.pieceName);

    if (piece === null) {
        throw new ActivepiecesError({
            code: ErrorCode.PIECE_NOT_FOUND,
            params: {
                pieceName: trigger.settings.pieceName,
                pieceVersion: trigger.settings.pieceVersion,
            },
        });
    }
    const pieceTrigger = piece.getTrigger(trigger.settings.triggerName);
    if (pieceTrigger == null) {
        throw new ActivepiecesError({
            code: ErrorCode.PIECE_TRIGGER_NOT_FOUND,
            params: {
                pieceName: trigger.settings.pieceName,
                pieceVersion: trigger.settings.pieceVersion,
                triggerName: trigger.settings.triggerName,
            },
        });
    }

    return pieceTrigger;
};

interface EnableOrDisableParams {
  collectionId: CollectionId;
  flowVersion: FlowVersion;
  projectId: ProjectId;
}

interface ExecuteTrigger {
  payload: unknown;
  projectId: ProjectId;
  collectionId: CollectionId;
  flowVersion: FlowVersion;
}
