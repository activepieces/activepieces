import { pieces, TriggerStrategy } from "pieces";
import { FlowVersion, PieceTrigger, TriggerType as FlowTriggerType } from "shared";
import { ActivepiecesError, ErrorCode } from "./activepieces-error";
import { flowQueue } from "../workers/flow-worker/flow-queue";

const PIECES_WEBHOOK_BASE_URL = "";

const EVERY_FIFTEEN_MINUTES = "* 15 * * * *";

export const triggerUtils = {
  async enable(flowVersion: FlowVersion): Promise<void> {
    switch (flowVersion.trigger.type) {
      case FlowTriggerType.PIECE:
        await enablePieceTrigger(flowVersion);
        break;

      case FlowTriggerType.SCHEDULE:
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

  async disable(flowVersion: FlowVersion): Promise<void> {
    switch (flowVersion.trigger.type) {
      case FlowTriggerType.PIECE:
        await disablePieceTrigger(flowVersion);
        break;

      case FlowTriggerType.SCHEDULE:
        await flowQueue.remove({
          id: flowVersion.id,
        });
        break;

      default:
        break;
    }
  },
};

const disablePieceTrigger = async (flowVersion: FlowVersion): Promise<void> => {
  const flowTrigger = flowVersion.trigger as PieceTrigger;
  const pieceTrigger = getPieceTrigger(flowTrigger);

  switch (pieceTrigger.type) {
    case TriggerStrategy.WEBHOOK:
      await pieceTrigger.onDisable({
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

const enablePieceTrigger = async (flowVersion: FlowVersion): Promise<void> => {
  const flowTrigger = flowVersion.trigger as PieceTrigger;
  const pieceTrigger = getPieceTrigger(flowTrigger);

  switch (pieceTrigger.type) {
    case TriggerStrategy.WEBHOOK:
      await pieceTrigger.onEnable({
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
