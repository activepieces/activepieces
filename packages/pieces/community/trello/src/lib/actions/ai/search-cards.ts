import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';

export const searchCards = createAction({
  auth: trelloAuth,
  name: 'search_cards',
  displayName: 'Search Cards (Agent)',
  description: 'Full-text search for Trello cards.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Trello cards by free-text query (name, description, comments) and returns matching cards with their ids. This is the primary way to resolve a card from text before acting on it; results are best-effort/eventually-consistent, so hydrate full fields via Get Card. Optionally narrow to specific boards or a list. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search text to match against cards.',
      required: true,
    }),
    board_ids: Property.Array({
      displayName: 'Board IDs',
      description:
        'Restrict the search to these board ids (obtain from List Boards). Leave empty to search all boards you can access.',
      required: false,
    }),
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'Restrict the search to a single list id.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of cards to return (1-1000, default 50).',
      required: false,
    }),
  },

  async run(context) {
    const qs: QueryParams = {
      query: context.propsValue['query'],
      modelTypes: 'cards',
      key: context.auth.username,
      token: context.auth.password,
    };
    const boardIds = context.propsValue['board_ids'] as string[] | undefined;
    if (boardIds && boardIds.length > 0) {
      qs['idBoards'] = boardIds.join(',');
    }
    if (context.propsValue['list_id']) {
      qs['idList'] = context.propsValue['list_id'] as string;
    }
    if (context.propsValue['limit']) {
      qs['cards_limit'] = String(context.propsValue['limit']);
    }

    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}search`,
        headers: { Accept: 'application/json' },
        queryParams: qs,
      };
      const response = await httpClient.sendRequest<{
        cards?: Array<Record<string, unknown>>;
      }>(request);
      const cards = response.body.cards ?? [];
      return { cards, count: cards.length };
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        throw new Error(
          'Permission denied searching cards. Check the connection token.'
        );
      }
      if (status === 429) {
        throw new Error('Trello rate limit exceeded. Retry after a short delay.');
      }
      throw error;
    }
  },
});
