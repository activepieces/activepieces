import { pieces, Trigger, TriggerStrategy } from "pieces/src";
import {
  CollectionId,
  CollectionVersionId,
  FlowId,
  FlowVersion,
  PieceTrigger,
  RunEnvironment,
  TriggerType,
} from "shared";
import { ActivepiecesError, ErrorCode } from "./activepieces-error";
import { flowQueue } from "../workers/flow-worker/flow-queue";
import { createContextStore } from "../store-entry/store-entry.service";
import { getPublicIp } from "./public-ip-utils";
import { system } from "./system/system";
import { SystemProp } from "./system/system-prop";

const EVERY_FIFTEEN_MINUTES = "* 15 * * * *";

export const triggerUtils = {
  async executeTrigger({ collectionId, payload, flowVersion }: ExecuteTrigger): Promise<any[]> {
    const flowTrigger = flowVersion.trigger;
    let payloads = [];
    switch (flowTrigger.type) {
      case TriggerType.PIECE:
        const pieceTrigger = getPieceTrigger(flowTrigger);
        payloads = await pieceTrigger.run({
          store: createContextStore(collectionId),
          webhookUrl: await getWebhookUrl(flowVersion.flowId),
          propsValue: flowTrigger.settings.input,
          payload: payload,
        });
        break;
      default:
        payloads = [payload];
        break;
    }
    return payloads;
  },
  async enable({ collectionId, collectionVersionId, flowVersion }: EnableParams): Promise<void> {
    switch (flowVersion.trigger.type) {
      case TriggerType.PIECE:
        await enablePieceTrigger({ collectionId, collectionVersionId, flowVersion });
        break;

      case TriggerType.SCHEDULE:
        console.log("Created Schedule for flow version Id " + flowVersion.id);

        await flowQueue.add({
          id: flowVersion.id,
          data: {
            environment: RunEnvironment.PRODUCTION,
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

  async disable(collectionId: CollectionId, flowVersion: FlowVersion): Promise<void> {
    switch (flowVersion.trigger.type) {
      case TriggerType.PIECE:
        await disablePieceTrigger(collectionId, flowVersion);
        break;

      case TriggerType.SCHEDULE:
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

const disablePieceTrigger = async (collectionId: CollectionId, flowVersion: FlowVersion): Promise<void> => {
  const flowTrigger = flowVersion.trigger as PieceTrigger;
  const pieceTrigger = getPieceTrigger(flowTrigger);

  switch (pieceTrigger.type) {
    case TriggerStrategy.WEBHOOK:
      await pieceTrigger.onDisable({
        store: createContextStore(collectionId),
        webhookUrl: await getWebhookUrl(flowVersion.flowId),
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

const enablePieceTrigger = async ({ flowVersion, collectionId, collectionVersionId }: EnableParams): Promise<void> => {
  const flowTrigger = flowVersion.trigger as PieceTrigger;
  const pieceTrigger = getPieceTrigger(flowTrigger);

  switch (pieceTrigger.type) {
    case TriggerStrategy.WEBHOOK:
      await pieceTrigger.onEnable({
        store: createContextStore(collectionId),
        webhookUrl: await getWebhookUrl(flowVersion.flowId),
        propsValue: flowTrigger.settings.input,
      });
      break;

    case TriggerStrategy.POLLING:
      await flowQueue.add({
        id: flowVersion.id,
        data: {
          environment: RunEnvironment.PRODUCTION,
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

const getWebhookUrl = async (flowId: FlowId): Promise<string> => {
  const webhookPath = `v1/webhooks?flowId=${flowId}`;
  let serverUrl = system.get(SystemProp.SERVER_URL);

  if (serverUrl !== undefined) {
    const { ip } = await getPublicIp();
    serverUrl = `http://${ip}:3000`
  }

  return `${serverUrl}/${webhookPath}`;
};

interface EnableParams {
  collectionId: CollectionId;
  collectionVersionId: CollectionVersionId;
  flowVersion: FlowVersion;
}

interface ExecuteTrigger {
  payload: any;
  collectionId: CollectionId;
  flowVersion: FlowVersion;
}
