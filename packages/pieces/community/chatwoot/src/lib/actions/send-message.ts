import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { chatwootEndpoints, CHATWOOT_AUTH_HEADER } from '../common/constants';
import {
  getChatwootAuth,
  ChatwootSendMessageResponse,
} from '../common/types';
import { chatwootAuth } from '../auth';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

async function sendWithRetry(
  baseUrl: string,
  accountId: number,
  conversationId: number,
  token: string,
  body: Record<string, unknown>,
): Promise<ChatwootSendMessageResponse> {
  const endpoints = chatwootEndpoints(baseUrl, accountId);
  const url = endpoints.CONVERSATION_MESSAGES(conversationId);
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response =
        await httpClient.sendRequest<ChatwootSendMessageResponse>({
          method: HttpMethod.POST,
          url,
          headers: {
            [CHATWOOT_AUTH_HEADER]: token,
            'Content-Type': 'application/json',
          },
          body,
        });

      return response.body;
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      const errorAny = error as {
        response?: { status: number; body: unknown };
      };
      const statusCode = errorAny.response?.status;
      const isRetryable =
        statusCode === 429 ||
        (statusCode !== undefined && statusCode >= 500);

      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        throw lastError;
      }

      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError ?? new Error('Send message failed after retries');
}

export const sendMessage = createAction({
  auth: chatwootAuth,
  name: 'send_message',
  classification: 'WRITE',
  displayName: 'Send Message',
  description: 'Reply in a Chatwoot conversation or add a private note.',
  audience: 'both',
  aiMetadata: {
    description:
      'Posts a new message to an existing Chatwoot conversation, identified by its numeric conversation display ID. Use to reply to a customer or, by enabling the private-note option, to leave an internal note visible only to agents rather than to the contact. Not idempotent — each call appends another message.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'destination',
      display: 'section',
      label: 'Send to',
      icon: 'send',
      props: ['conversationId'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['message', 'isPrivate'],
    },
  ],
  props: {
    conversationId: Property.Number({
      displayName: 'Conversation ID',
      description:
        'From the trigger, or the number after /conversations/ in Chatwoot.',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description:
        "What the contact sees, or the note's text when Private Note is on.",
      placeholder: "Thanks for reaching out! We're looking into it.",
      required: true,
    }),
    isPrivate: Property.Checkbox({
      displayName: 'Private Note',
      description: 'Only agents see it; the contact is not notified.',
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { conversationId, message, isPrivate } = context.propsValue;
    const authValue = getChatwootAuth(context.auth);

    const body = {
      content: message,
      message_type: 'outgoing',
      private: isPrivate,
      content_type: 'text',
    };

    const result = await sendWithRetry(
      authValue.baseUrl,
      authValue.accountId,
      conversationId,
      authValue.apiAccessToken,
      body,
    );

    return {
      success: true,
      messageId: result.id,
      conversationId: result.conversation_id,
      status: result.status,
    };
  },
});
