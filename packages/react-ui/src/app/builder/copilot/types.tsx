import { CopilotFlowOutline, ImportFlowRequest, UpdateActionRequest } from "@activepieces/shared";
import { nanoid } from "nanoid";

export type AiMessageContent = {
    id: string;
    type: 'assistant_message';
    content: string;
}

export type UserMessageContent = {
    id: string;
    type: 'user_message';
    content: string;
}

export type FlowPlanMessageContnt = {
    id: string;
    type: 'flow_plan';
    content: {
        plan: CopilotFlowOutline;
        operation: ImportFlowRequest;
    };
}

export type CodeBlockMessageContent = {
    id: string;
    type: 'code_block';
    content: {
        code: string;
        operation: UpdateActionRequest;
        inputs: Record<string,string>
    };
}

export type MessageContent = AiMessageContent | UserMessageContent | FlowPlanMessageContnt | CodeBlockMessageContent;

export const INITIAL_COPILOT_MESSAGE: MessageContent = {
    id: nanoid(),
    type: 'assistant_message',
    content: 'Hi I am Flow Ninja, I can help you build your flow. What would you like to automate?',
  }