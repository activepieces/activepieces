import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { chaindeskAuth } from '../common/auth';
import {
  BASE_URL,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from '../common/constants';
import { chaindeskOutputSchemas } from '../common/output-schemas';
import { withNotFoundHint } from '../common/errors';
import { ChaindeskRecord } from '../common/types';

export const getConversationMessagesAction = createAction({
  auth: chaindeskAuth,
  name: 'get-conversation-messages',
  displayName: 'Get Conversation Messages',
  description: 'Gets the messages of a conversation.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the messages of one Chaindesk (Askli) conversation by conversation ID, one page at a time (up to 100), with who sent each (human or agent) and its text. Returns a next_cursor to pass back as Cursor for the next page (empty when no more). Get the conversation ID from Query Agent or List Conversations. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      required: true,
    }),
    take: Property.Number({
      displayName: 'Limit',
      description: 'How many items to return (1-100). Default 20.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description:
        'The Next Cursor value from a previous call, to get the next page.',
      required: false,
    }),
  },
  outputSchema: chaindeskOutputSchemas.conversationMessages,
  async run(context) {
    if (!context.propsValue.conversationId.trim()) {
      throw new Error('Conversation ID cannot be empty.');
    }
    const { conversationId, take, cursor } = context.propsValue;
    const pageSize = take ?? DEFAULT_PAGE_SIZE;
    if (
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > MAX_PAGE_SIZE
    ) {
      throw new Error('Limit must be a whole number from 1 to 100.');
    }
    const queryParams: Record<string, string> = { take: String(pageSize) };
    const trimmedCursor = cursor?.trim();
    if (trimmedCursor) {
      queryParams['cursor'] = trimmedCursor;
    }
    const response = await withNotFoundHint({
      request: () =>
        httpClient.sendRequest<ChaindeskRecord[]>({
          method: HttpMethod.GET,
          url:
            BASE_URL +
            `/conversations/${encodeURIComponent(
              conversationId.trim()
            )}/messages`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: context.auth.secret_text,
          },
          queryParams,
        }),
      readOnly: true,
      resourceName: 'conversation',
      notFoundMessage: `Conversation ${conversationId.trim()} was not found, or this API key cannot access it.`,
    });
    if (!Array.isArray(response.body)) {
      throw new Error(
        'Chaindesk returned an unexpected messages response (expected a list).'
      );
    }
    const messages = response.body;
    const last = messages[messages.length - 1];
    return {
      messages,
      count: messages.length,
      next_cursor: messages.length === pageSize && last?.id ? last.id : null,
    };
  },
});
