import { UIMessage } from 'ai';

export type ChatDataParts = {
  'session-title': { title: string };
};

export type ChatUIMessage = UIMessage<unknown, ChatDataParts>;

export type DynamicToolPart = Extract<
  ChatUIMessage['parts'][number],
  { type: 'dynamic-tool' }
>;
