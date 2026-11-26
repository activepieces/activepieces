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
import { withSafeError } from '../common/errors';
import { optionalAgentIdDropdown } from '../common/props';
import { ChaindeskRecord } from '../common/types';

export const listConversationsAction = createAction({
  auth: chaindeskAuth,
  name: 'list-conversations',
  displayName: 'List Conversations',
  description: 'Lists conversations, optionally for one agent.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Chaindesk (Askli) conversations, optionally only those of one agent, one page at a time (up to 100). Returns each conversation ID with its details, plus a next_cursor to pass back as Cursor for the next page (empty when no more). Use to find a conversation ID for Get Conversation Messages or to continue a thread with Query Agent. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    agentId: optionalAgentIdDropdown,
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
  outputSchema: chaindeskOutputSchemas.listConversations,
  async run(context) {
    const { agentId, take, cursor } = context.propsValue;
    const pageSize = take ?? DEFAULT_PAGE_SIZE;
    if (
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > MAX_PAGE_SIZE
    ) {
      throw new Error('Limit must be a whole number from 1 to 100.');
    }
    const queryParams: Record<string, string> = { take: String(pageSize) };
    if (agentId) {
      queryParams['agentId'] = agentId;
    }
    const trimmedCursor = cursor?.trim();
    if (trimmedCursor) {
      queryParams['cursor'] = trimmedCursor;
    }
    const response = await withSafeError(() =>
      httpClient.sendRequest<ChaindeskRecord[]>({
        method: HttpMethod.GET,
        url: BASE_URL + '/conversations',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.secret_text,
        },
        queryParams,
      })
    );
    if (!Array.isArray(response.body)) {
      throw new Error(
        'Chaindesk returned an unexpected conversations response (expected a list).'
      );
    }
    const conversations = response.body;
    const last = conversations[conversations.length - 1];
    return {
      conversations,
      count: conversations.length,
      next_cursor:
        conversations.length === pageSize && last?.id ? last.id : null,
    };
  },
});
