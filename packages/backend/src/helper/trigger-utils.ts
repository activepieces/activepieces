import { pieces, TriggerStrategy } from "pieces";
import { CollectionId, FlowVersion, PieceTrigger, TriggerType as FlowTriggerType } from "shared";
import { ActivepiecesError, ErrorCode } from "./activepieces-error";
import { flowQueue } from "../workers/flow-worker/flow-queue";
import { createContextStore } from "../store-entry/store-entry.service";

const PIECES_WEBHOOK_BASE_URL = "";

const EVERY_FIFTEEN_MINUTES = "* 15 * * * *";

export const triggerUtils = {
  async enable(collectionId: CollectionId, flowVersion: FlowVersion): Promise<void> {
    switch (flowVersion.trigger.type) {
      case FlowTriggerType.PIECE:
        await enablePieceTrigger(collectionId, flowVersion);
        break;

      case FlowTriggerType.SCHEDULE:
        console.log("Created Schedule for flow version Id " + flowVersion.id);
        await flowQueue.add({
          id: flowVersion.id,
          data: {
            flowVersionId: flowVersion.id,
          },
          cronExpression: flowVersion.trigger.settings.cronExpression,
        });
        break;
      default:
        break;
    }
  },

  async disable(collectionId: CollectionId, flowVersion: FlowVersion): Promise<void> {
    switch (flowVersion.trigger.type) {
      case FlowTriggerType.PIECE:
        await disablePieceTrigger(collectionId, flowVersion);
        break;

      case FlowTriggerType.SCHEDULE:
        console.log("Deleted Schedule for flow version Id " + flowVersion.id);
        await flowQueue.remove({
          id: flowVersion.id,
        });
        break;

      default:
        break;
    }
  },
};

const disablePieceTrigger = async (collectionId: CollectionId, flowVersion: FlowVersion): Promise<void> => {
  const flowTrigger = flowVersion.trigger as PieceTrigger;
  const pieceTrigger = getPieceTrigger(flowTrigger);

  switch (pieceTrigger.type) {
    case TriggerStrategy.WEBHOOK:
      await pieceTrigger.onDisable({
        store: createContextStore(collectionId),
        webhookUrl: `${PIECES_WEBHOOK_BASE_URL}/flow-version/${flowVersion.id}`,
        propsValue: flowTrigger.settings.input,
      });
      break;

    case TriggerStrategy.POLLING:
      await flowQueue.remove({
        id: flowVersion.id,
      });
      break;
  }
};

const enablePieceTrigger = async (collectionId: CollectionId, flowVersion: FlowVersion): Promise<void> => {
  const flowTrigger = flowVersion.trigger as PieceTrigger;
  const pieceTrigger = getPieceTrigger(flowTrigger);

  switch (pieceTrigger.type) {
    case TriggerStrategy.WEBHOOK:
      await pieceTrigger.onEnable({
        store: createContextStore(collectionId),
        webhookUrl: `${PIECES_WEBHOOK_BASE_URL}/flow-version/${flowVersion.id}`,
        propsValue: flowTrigger.settings.input,
      });
      break;

    case TriggerStrategy.POLLING:
      await flowQueue.add({
        id: flowVersion.id,
        data: {
          flowVersionId: flowVersion.id,
        },
        cronExpression: EVERY_FIFTEEN_MINUTES,
      });
      break;
  }
};

const getPieceTrigger = (trigger: PieceTrigger) => {
  const piece = pieces.find((p) => p.name === trigger.settings.pieceName);

  if (piece == null) {
    throw new ActivepiecesError({
      code: ErrorCode.PIECE_NOT_FOUND,
      params: {
        pieceName: trigger.settings.pieceName,
      },
    });
  }

  const pieceTrigger = piece.getTrigger(trigger.settings.triggerName);

  if (pieceTrigger == null) {
    throw new ActivepiecesError({
      code: ErrorCode.PIECE_TRIGGER_NOT_FOUND,
      params: {
        pieceName: trigger.settings.pieceName,
        triggerName: trigger.settings.triggerName,
      },
    });
  }

  return pieceTrigger;
};
