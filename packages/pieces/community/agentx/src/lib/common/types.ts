import type { AppConnectionType } from '@activepieces/pieces-framework';

export type AgentxAuthValue = {
  type: AppConnectionType.SECRET_TEXT;
  secret_text: string;
};

export type AgentxAgent = {
  _id: string;
  id?: string;
  name?: string;
  createdAt: string;
};

export type AgentxMessage = {
  id?: string;
  text?: string;
  content?: string;
};

export type AgentxConversation = {
  _id: string;
  id?: string;
  title?: string;
  type?: string;
  createdAt: string;
  messages?: AgentxMessage[];
};

export type AgentxMessageReply = Record<string, unknown>;

export type AgentxObject = Record<string, unknown>;
