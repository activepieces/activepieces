import { pieces } from "@activepieces/pieces-apps";
import { ExecuteEventParserOperation, ExecuteTriggerOperation, ExecutionState, ParseEventResponse, PieceTrigger, TriggerHookType } from "@activepieces/shared";
import { createContextStore } from "../services/storage.service";
import { VariableService } from "../services/variable-service";

export const triggerHelper = {
  async executeEventParser(params: ExecuteEventParserOperation): Promise<ParseEventResponse | undefined> {
    const piece = pieces.find((p) => p.name === params.pieceName);
    if(piece === undefined){
      throw new Error(`Piece is not found ${params.pieceName}`)
    }
    return piece.events?.parseAndReply(params.event);
  },
  async executeTrigger(params: ExecuteTriggerOperation) {
    const flowTrigger: PieceTrigger = params.flowVersion.trigger as PieceTrigger;
    const piece = pieces.find((p) => p.name === flowTrigger.settings.pieceName);
    const trigger = piece?.getTrigger(flowTrigger.settings.triggerName);
    if (trigger === undefined) {
      throw new Error(`Piece trigger is not found ${flowTrigger.settings.triggerName} and piece name ${flowTrigger.settings.pieceName}`)
    }
    const variableService = new VariableService();
    const executionState = new ExecutionState();
    executionState.insertConfigs(params.collectionVersion);
    const resolvedInput = await variableService.resolve(flowTrigger.settings.input, executionState);
    const appListeners: { events: string[], identifierValue: string, identifierKey: string }[] = [];
    const context = {
      store: createContextStore(params.flowVersion.flowId),
      app: {
        async createListeners({ events, identifierKey, identifierValue }: { events: string[], identifierValue: string, identifierKey: string }) {
          appListeners.push({ events, identifierValue, identifierKey });
        }
      },
      webhookUrl: params.webhookUrl,
      propsValue: resolvedInput,
      payload: params.triggerPayload,
    };
    switch (params.hookType) {
      case TriggerHookType.ON_DISABLE:
        await trigger.onDisable(context);
        return {
          eventListners: appListeners
        }
      case TriggerHookType.ON_ENABLE:
        await trigger.onEnable(context);
        return {
          eventListners: appListeners
        }
      case TriggerHookType.RUN:
        // TODO: fix types to remove use of any
        return trigger.run(context as any);
    }
  },
}
