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

export const listLists = createAction({
  auth: trelloAuth,
  name: 'list_lists',
  displayName: 'List Lists (Agent)',
  description: 'List the lists (columns) on a Trello board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the lists (columns) on a Trello board, returning each list id and name. This is the key resolver for turning a column name into a list_id used by Create Card, Move Card, and other list actions. Obtain board_id from List Boards. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description: 'The ID of the board. Obtain it from List Boards.',
      required: true,
    }),
    filter: Property.StaticDropdown({
      displayName: 'Filter',
      description: 'Which lists to include.',
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
        url: `${trelloCommon.baseUrl}boards/${context.propsValue['board_id']}/lists`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const lists = response.body ?? [];
      return { lists, count: lists.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Board not found. Verify the board_id (resolve it via List Boards).'
      );
    }
  },
});
