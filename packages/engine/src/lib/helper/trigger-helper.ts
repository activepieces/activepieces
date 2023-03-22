import { pieces } from "@activepieces/pieces-apps";
import { ApEdition, EventPayload, ExecuteEventParserOperation, ExecuteTriggerOperation, ExecuteTriggerResponse, ExecutionState, ParseEventResponse, PieceTrigger, TriggerHookType, TriggerStrategy } from "@activepieces/shared";
import { createContextStore } from "../services/storage.service";
import { VariableService } from "../services/variable-service";
import { pieceHelper } from "./piece-helper";

type Listener = {
  events: string[];
  identifierValue: string;
  identifierKey: string;
}

export const triggerHelper = {
  async executeEventParser(params: ExecuteEventParserOperation): Promise<ParseEventResponse | undefined> {
    const piece = pieces.find((p) => p.name === params.pieceName);
    if (piece === undefined) {
      throw new Error(`Piece is not found ${params.pieceName}`)
    }
    return piece.events?.parseAndReply({ payload: params.event });
  },

  async executeTrigger(params: ExecuteTriggerOperation): Promise<ExecuteTriggerResponse | unknown[] | unknown> {
    const { pieceName, pieceVersion, triggerName, input } = (params.flowVersion.trigger as PieceTrigger).settings;

    const piece = await pieceHelper.loadPiece(pieceName, pieceVersion);
    const trigger = piece?.getTrigger(triggerName);

    if (trigger === undefined) {
      throw new Error(`trigger not found, pieceName=${pieceName}, triggerName=${triggerName}`)
    }

    const variableService = new VariableService();
    const executionState = new ExecutionState();
    const resolvedInput = await variableService.resolve(input, executionState);
    const appListeners: Listener[] = [];

    const prefix = (params.hookType === TriggerHookType.TEST) ? 'test' : '';
    const context = {
      store: createContextStore(prefix, params.flowVersion.flowId),
      app: {
        async createListeners({ events, identifierKey, identifierValue }: Listener) {
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
          listeners: []
        }
      case TriggerHookType.ON_ENABLE:
        await trigger.onEnable(context);
        return {
          listeners: appListeners
        }
    case TriggerHookType.TEST:
          // TODO: fix types to remove use of any
          return trigger.test(context as any);
      case TriggerHookType.RUN:
        if (trigger.type === TriggerStrategy.APP_WEBHOOK) {
          if (params.edition === ApEdition.COMMUNITY) {
            return [];
          }

          if (!params.appWebhookUrl) {
            throw new Error(`App webhook url is not avaiable for piece name ${pieceName}`)
          }
          if (!params.webhookSecret) {
            throw new Error(`Webhook secret is not avaiable for piece name ${pieceName}`)
          }

          try {
            const verified = piece?.events?.verify({
              appWebhookUrl: params.appWebhookUrl,
              payload: params.triggerPayload as EventPayload,
              webhookSecret: params.webhookSecret,
            });

            if (verified === false) {
              console.log("Webhook is not verified");
              return [];
            }
          } catch (e) {
            console.error("Error while verifying webhook", e);
            return [];
          }
        }
        return trigger.run(context as any);
    }
  },
}
