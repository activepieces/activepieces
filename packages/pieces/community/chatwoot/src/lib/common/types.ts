import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { chatwootAuth } from '../auth';

export interface ChatwootWebhookSender {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
  type?: string;
}

export interface ChatwootWebhookContact {
  id: number;
  name: string;
  email?: string;
  phone_number?: string;
}

export interface ChatwootWebhookConversation {
  display_id: number;
  additional_attributes?: Record<string, unknown>;
}

export interface ChatwootWebhookAccount {
  id: number;
  name: string;
}

export type ChatwootMessageType = 'incoming' | 'outgoing' | 'template';

export interface ChatwootWebhookPayload {
  event: string;
  id: number;
  content: string;
  created_at: string;
  message_type: ChatwootMessageType;
  content_type: string;
  content_attributes: Record<string, unknown>;
  source_id: string;
  sender: ChatwootWebhookSender;
  contact: ChatwootWebhookContact;
  conversation: ChatwootWebhookConversation;
  account: ChatwootWebhookAccount;
}

export interface ChatwootParsedMessage {
  messageId: number;
  content: string;
  messageType: ChatwootMessageType;
  conversationId: number;
  contactId: number;
  contactName: string;
  accountId: number;
  createdAt: string;
}

export interface ChatwootCreateWebhookRequest {
  url: string;
  subscriptions: string[];
}

export interface ChatwootWebhookResponse {
  payload:{
    webhook:{
      id:number
    }
  }
}

/** Single webhook in list response (GET /webhooks) */
export interface ChatwootWebhookListItem {
  id: number;
  url: string;
  subscriptions?: string[];
  account_id?: number;
}

export interface ChatwootSendMessageRequest {
  content: string;
  message_type: 'outgoing';
  private: boolean;
  content_type: 'text';
}

export interface ChatwootSendMessageResponse {
  id: number;
  content: string;
  account_id: number;
  inbox_id: number;
  conversation_id: number;
  message_type: number;
  created_at: number;
  updated_at: number;
  private: boolean;
  status: string;
  content_type: string;
  sender_type: string;
  sender_id: number;
}

export interface ChatwootAuthProps {
  baseUrl: string;
  apiAccessToken: string;
  accountId: number;
}

/** Normalize auth from either V0 (props only) or V1 (connection value with type + props) */
export function getChatwootAuth(auth: AppConnectionValueForAuthProperty<typeof chatwootAuth>): ChatwootAuthProps {
  return {
    baseUrl: auth.props.baseUrl ?? '',
    accountId: auth.props.accountId ?? 0,
    apiAccessToken: auth.props.apiAccessToken ?? '',
  };
}
