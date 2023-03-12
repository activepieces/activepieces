import { pieces } from "@activepieces/pieces-apps";
import { ExecuteTriggerOperation, ExecutionState, PieceTrigger, TriggerHookType } from "@activepieces/shared";
import { createContextStore } from "../services/storage.service";
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

    const prefix = (params.hookType === TriggerHookType.TEST) ? 'test' : '';
    const context = {
      store: createContextStore(prefix, params.flowVersion.flowId),
      webhookUrl: params.webhookUrl,
      propsValue: resolvedInput,
      payload: params.triggerPayload,
    };
    switch (params.hookType) {
      case TriggerHookType.ON_DISABLE:
        return trigger.onDisable(context);
      case TriggerHookType.ON_ENABLE:
        return trigger.onEnable(context);
      case TriggerHookType.TEST:
        // TODO: fix types to remove use of any
        return trigger.test(context as any);
      case TriggerHookType.RUN:
        // TODO: fix types to remove use of any
        return trigger.run(context as any);
    }
  },
}
