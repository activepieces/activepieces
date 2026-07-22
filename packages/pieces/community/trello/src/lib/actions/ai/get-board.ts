import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { getBoardActionOutputSchema } from '../../output-schemas';

export const getBoard = createAction({
  auth: trelloAuth,
  name: 'get_board',
  displayName: 'Get Board (Agent)',
  description: 'Get the details of a Trello board by ID.',
  audience: 'ai',
  outputSchema: getBoardActionOutputSchema,
  aiMetadata: {
    description:
      'Retrieves the details of a single Trello board by its board_id (name, description, url, prefs). Obtain board_id from List Boards. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description: 'The ID of the board. Obtain it from List Boards.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}boards/${context.propsValue['board_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
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
