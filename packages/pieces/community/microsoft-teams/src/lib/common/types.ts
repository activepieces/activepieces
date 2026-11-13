import type { AadUserConversationMember } from '@microsoft/microsoft-graph-types';

export type {
  CallRecording,
  CallTranscript,
  Channel,
  Chat,
  ChatMessage,
  ConversationMember,
  Team,
} from '@microsoft/microsoft-graph-types';

export type MicrosoftTeamsAuthValue = {
  access_token: string;
  props?: { cloud?: string | null };
};

export type MicrosoftTeamsPage<T> = {
  value: T[];
  '@odata.nextLink'?: string;
  '@odata.deltaLink'?: string;
};

export type MicrosoftTeamsMember = AadUserConversationMember & {
  userPrincipalName?: string;
};

export type MicrosoftTeamsMe = {
  id: string;
  userPrincipalName?: string;
};

export type MicrosoftTeamsTokenClaims = {
  oid?: string;
  tid?: string;
};

export type MicrosoftTeamsGraphError = {
  statusCode?: number;
  status?: number;
  code?: string;
  message?: string;
  requestId?: string;
  headers?: Record<string, string>;
  response?: {
    status?: number;
    statusCode?: number;
    headers?: Record<string, string>;
  };
  error?: MicrosoftTeamsGraphErrorBody;
  body?: { error?: MicrosoftTeamsGraphErrorBody };
};

type MicrosoftTeamsGraphErrorBody = {
  code?: string;
  message?: string;
  innerError?: MicrosoftTeamsGraphInnerError;
  innererror?: MicrosoftTeamsGraphInnerError;
};

type MicrosoftTeamsGraphInnerError = {
  'request-id'?: string;
  requestId?: string;
};
