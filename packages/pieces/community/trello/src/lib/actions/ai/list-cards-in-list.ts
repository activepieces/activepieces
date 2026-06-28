import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const listCardsInList = createAction({
  auth: trelloAuth,
  name: 'list_cards_in_list',
  displayName: 'List Cards In List (Agent)',
  description: 'List all cards in a Trello list.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the cards in a single Trello list identified by list_id, returning each card id and fields. Use it to enumerate the cards of a column (e.g. "what is in To Do"). Obtain list_id from List Lists. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list. Obtain it from List Lists.',
      required: true,
    }),
    filter: Property.StaticDropdown({
      displayName: 'Filter',
      description: 'Which cards to include.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed (archived)', value: 'closed' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
  },

  async run(context) {
    const params: QueryParams = {};
    if (context.propsValue['filter']) {
      params['filter'] = context.propsValue['filter'] as string;
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}lists/${context.propsValue['list_id']}/cards`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const cards = response.body ?? [];
      return { cards, count: cards.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'List not found. Verify the list_id (resolve it via List Lists).'
      );
    }
  },
});
