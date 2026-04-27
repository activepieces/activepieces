import { UIMessage } from 'ai';

export type ChatDataParts = {
  'session-title': { title: string };
  plan: { entries: Array<{ content: string; status: string }> };
  usage: { inputTokens: number; outputTokens: number };
};

export type ChatUIMessage = UIMessage<unknown, ChatDataParts>;

export type DynamicToolPart = Extract<
  ChatUIMessage['parts'][number],
  { type: 'dynamic-tool' }
>;
