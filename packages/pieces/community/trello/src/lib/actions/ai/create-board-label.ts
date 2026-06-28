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

export const createBoardLabel = createAction({
  auth: trelloAuth,
  name: 'create_board_label',
  displayName: 'Create Board Label (Agent)',
  description: 'Define a reusable label on a Trello board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a reusable label (name + color) on a Trello board. Returns the new label id, which you can then attach to cards with Add Label To Card. Obtain board_id from List Boards. Each call creates a distinct label, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description: 'The board to create the label on. Obtain it from List Boards.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Label Name',
      required: false,
    }),
    color: Property.ShortText({
      displayName: 'Color',
      description:
        'Label color (e.g. green, yellow, orange, red, purple, blue, sky, lime, pink, black) or leave empty for no color.',
      required: false,
    }),
  },

  async run(context) {
    const params: QueryParams = {
      idBoard: context.propsValue['board_id'],
    };
    if (context.propsValue['name']) {
      params['name'] = context.propsValue['name'] as string;
    }
    if (context.propsValue['color']) {
      params['color'] = context.propsValue['color'] as string;
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}labels`,
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
