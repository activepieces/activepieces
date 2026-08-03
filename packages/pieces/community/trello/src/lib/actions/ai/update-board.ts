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
import { updateBoardActionOutputSchema } from '../../output-schemas';

export const updateBoard = createAction({
  auth: trelloAuth,
  name: 'update_board',
  displayName: 'Update Board (Agent)',
  description: 'Rename or redescribe a Trello board.',
  audience: 'ai',
  outputSchema: updateBoardActionOutputSchema,
  aiMetadata: {
    description:
      'Updates the name and/or description of a Trello board identified by board_id. Obtain board_id from List Boards. Only provided fields change; setting the same values again converges to the same board, so it is idempotent.',
    idempotent: true,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description: 'The ID of the board. Obtain it from List Boards.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'New Description',
      required: false,
    }),
  },

  async run(context) {
    const params: QueryParams = {};
    if (context.propsValue['name']) {
      params['name'] = context.propsValue['name'] as string;
    }
    if (context.propsValue['description']) {
      params['desc'] = context.propsValue['description'] as string;
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}boards/${context.propsValue['board_id']}`,
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
