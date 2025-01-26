import { nanoid } from 'nanoid';

import { PieceTriggerSettings } from '@activepieces/shared';

export type AiMessageContent = {
  id: string;
  type: 'assistant_message';
  content: string;
};

export type UserMessageContent = {
  id: string;
  type: 'user_message';
  content: string;
};

export enum CopilotStepStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
  RUNNING = 'running',
}

type PlanStep = {
  title: string;
  description: string;
  status: CopilotStepStatus;
} & (
  | {
      isTrigger: true;
      triggerSettings: PieceTriggerSettings;
    }
  | {
      isTrigger: false;
    }
);
export type FlowPlanMessageContent = {
  id: string;
  type: 'plan';
  content: {
    steps: PlanStep[];
  };
};

export type MessageContent =
  | AiMessageContent
  | UserMessageContent
  | FlowPlanMessageContent;

export const INITIAL_COPILOT_MESSAGES: MessageContent[] = [
  {
    id: nanoid(),
    type: 'assistant_message',
    content: "Hey! I'm APY, How can I help you today?",
  },
];
