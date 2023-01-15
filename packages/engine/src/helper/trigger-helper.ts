import { pieces, Store, Trigger } from "pieces";
import { ActivepiecesError, ErrorCode, ExecuteTriggerOperation, ExecutionState, PieceTrigger, TriggerHookType } from "shared";
import { storageService } from "../services/storage.service";
import { VariableService } from "../services/variable-service";

export const triggerHelper = {
  async executeTrigger(params: ExecuteTriggerOperation) {
    const flowTrigger: PieceTrigger = params.flowVersion.trigger as PieceTrigger;
    const trigger = getPieceTrigger(flowTrigger);
    const variableService = new VariableService();
    const executionState = new ExecutionState();
    executionState.insertConfigs(params.collectionVersion);
    const resolvedInput = await variableService.resolve(flowTrigger.settings.input, executionState);

    let context = {
      store: createContextStore(),
      webhookUrl: params.webhookUrl,
      propsValue: resolvedInput,
      payload: params.triggerPayload,
    };
    switch (params.hookType) {
      case TriggerHookType.ON_DISABLE:
        return trigger.onDisable(context);
      case TriggerHookType.ON_ENABLE:
        return trigger.onEnable(context);
      case TriggerHookType.RUN:
        return trigger.run(context);
    }
  },
}

function createContextStore(): Store {
  return {
    save: async function <T>(key: string, value: T): Promise<T> {
      const storeEntry = await storageService.put({
        key: key,
        value: value,
      });
      return value;
    },
    get: async function <T>(key: string): Promise<T | null> {
      const storeEntry = await storageService.get(key);
      if (storeEntry === null) {
        return null;
      }
      return storeEntry.value as T;
    },
  };
}


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
