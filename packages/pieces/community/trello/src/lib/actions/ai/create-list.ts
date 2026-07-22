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
import { createListActionOutputSchema } from '../../output-schemas';

export const createList = createAction({
  auth: trelloAuth,
  name: 'create_list',
  displayName: 'Create List (Agent)',
  description: 'Create a list (column) on a Trello board.',
  audience: 'ai',
  outputSchema: createListActionOutputSchema,
  aiMetadata: {
    description:
      'Creates a new list (column) on a Trello board. Returns the new list id for use with card actions. Obtain board_id from List Boards. Each call creates a distinct list, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description: 'The board to create the list on. Obtain it from List Boards.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'List Name',
      required: true,
    }),
    position: Property.StaticDropdown({
      displayName: 'Position',
      required: false,
      options: {
        options: [
          { label: 'Top', value: 'top' },
          { label: 'Bottom', value: 'bottom' },
        ],
      },
    }),
  },

  async run(context) {
    const params: QueryParams = {
      name: context.propsValue['name'],
      idBoard: context.propsValue['board_id'],
    };
    if (context.propsValue['position']) {
      params['pos'] = context.propsValue['position'] as string;
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}lists`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Board not found. Verify the board_id (resolve it via List Boards).'
      );
    }
  },
});
