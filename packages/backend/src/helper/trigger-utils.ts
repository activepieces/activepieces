import { pieces, Trigger, TriggerStrategy } from "pieces";
import { CollectionVersionId, FlowVersion, InstanceId, PieceTrigger, TriggerType as FlowTriggerType } from "shared";
import { ActivepiecesError, ErrorCode } from "./activepieces-error";
import { flowQueue } from "../workers/flow-worker/flow-queue";

const PIECES_WEBHOOK_BASE_URL = "";

const EVERY_FIFTEEN_MINUTES = "* 15 * * * *";

export const triggerUtils = {
  async enable({ instanceId, collectionVersionId, flowVersion }: EnableParams): Promise<void> {
    switch (flowVersion.trigger.type) {
      case FlowTriggerType.PIECE:
        await enablePieceTrigger({ instanceId, collectionVersionId, flowVersion });
        break;

      case FlowTriggerType.SCHEDULE:
        console.log("Created Schedule for flow version Id " + flowVersion.id);

        await flowQueue.add({
          id: flowVersion.id,
          data: {
            instanceId,
            collectionVersionId,
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
        console.log("Deleted Schedule for flow version Id " + flowVersion.id);
        await flowQueue.remove({
          id: flowVersion.id,
          repeatable: true,
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
        repeatable: true,
      });
      break;
  }
};

const enablePieceTrigger = async ({ instanceId, flowVersion, collectionVersionId }: EnableParams): Promise<void> => {
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
          instanceId,
          collectionVersionId,
          flowVersionId: flowVersion.id,
        },
        cronExpression: EVERY_FIFTEEN_MINUTES,
      });

      break;
  }
};

const getPieceTrigger = (trigger: PieceTrigger): Trigger => {
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

interface EnableParams {
  instanceId: InstanceId;
  collectionVersionId: CollectionVersionId;
  flowVersion: FlowVersion;
}
