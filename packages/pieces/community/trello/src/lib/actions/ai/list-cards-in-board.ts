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
import { listCardsInBoardActionOutputSchema } from '../../output-schemas';

export const listCardsInBoard = createAction({
  auth: trelloAuth,
  name: 'list_cards_in_board',
  displayName: 'List Cards In Board (Agent)',
  description: 'List all cards on a Trello board.',
  audience: 'ai',
  outputSchema: listCardsInBoardActionOutputSchema,
  aiMetadata: {
    description:
      'Lists every card on a Trello board identified by board_id, returning each card id and fields. Use it to enumerate all cards across a board. Obtain board_id from List Boards. Read-only and idempotent.',
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
      description: 'Which cards to include.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed (archived)', value: 'closed' },
          { label: 'All', value: 'all' },
          { label: 'Visible', value: 'visible' },
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
        url: `${trelloCommon.baseUrl}boards/${context.propsValue['board_id']}/cards`,
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
        'Board not found. Verify the board_id (resolve it via List Boards).'
      );
    }
  },
});
