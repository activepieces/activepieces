import { pieces, Store } from "@activepieces/framework";
import { ExecuteTriggerOperation, ExecutionState, PieceTrigger, TriggerHookType } from "@activepieces/shared";
import { createContextStore, storageService } from "../services/storage.service";
import { VariableService } from "../services/variable-service";

export const triggerHelper = {
  async executeTrigger(params: ExecuteTriggerOperation) {
    const flowTrigger: PieceTrigger = params.flowVersion.trigger as PieceTrigger;
    const trigger = pieces.find((p) => p.name === flowTrigger.settings.pieceName)?.getTrigger(flowTrigger.settings.triggerName);
    if (trigger === undefined) {
      throw new Error(`Piece trigger is not found ${flowTrigger.settings.triggerName} and piece name ${flowTrigger.settings.pieceName}`)
    }
    const variableService = new VariableService();
    const executionState = new ExecutionState();
    executionState.insertConfigs(params.collectionVersion);
    const resolvedInput = await variableService.resolve(flowTrigger.settings.input, executionState);

    let context = {
      store: createContextStore(params.flowVersion.flowId),
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
        return trigger.run(context as any);
    }
  },
}
