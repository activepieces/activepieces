import { CopilotFlowOutline, ImportFlowRequest, UpdateActionRequest } from "@activepieces/shared";

export type AiMessageContent = {
    type: 'assistant_message';
    content: string;
}

export type UserMessageContent = {
    type: 'user_message';
    content: string;
}

export type FlowPlanMessageContnt = {
    type: 'flow_plan';
    content: {
        plan: CopilotFlowOutline;
        operation: ImportFlowRequest;
    };
}

export type CodeBlockMessageContent = {
    type: 'code_block';
    content: {
        code: string;
        operation: UpdateActionRequest;
        inputs: Record<string,string>
    };
}

export type MessageContent = AiMessageContent | UserMessageContent | FlowPlanMessageContnt | CodeBlockMessageContent;

export const INITIAL_COPILOT_MESSAGE: MessageContent = {
    type: 'assistant_message',
    content: 'Hi I am Flow Ninja, I can help you build your flow. What would you like to automate?',
  }