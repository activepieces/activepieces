import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { moveListToBoardActionOutputSchema } from '../../output-schemas';

export const moveListToBoard = createAction({
  auth: trelloAuth,
  name: 'move_list_to_board',
  classification: 'WRITE',
  displayName: 'Move List To Board (Agent)',
  description: 'Move a whole list, with its cards, to another board.',
  audience: 'ai',
  outputSchema: moveListToBoardActionOutputSchema,
  aiMetadata: {
    description:
      'Moves an entire list, and every card on it, to a different board. Use it to reorganise across boards; use Move All Cards In List to move the cards while leaving the list where it is, and Move Card for a single card. Labels and members that do not exist on the destination board may be dropped from the moved cards, so check the result. Moving a list that already sits on that board is a no-op, so it is idempotent.',
    idempotent: true,
  },
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to move. Obtain it from List Lists.',
      required: true,
    }),
    board_id: Property.ShortText({
      displayName: 'Destination Board ID',
      description:
        'The ID of the board to move the list to. Obtain it from List Boards.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}lists/${context.propsValue['list_id']}/idBoard`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, {
          value: context.propsValue['board_id'],
        }),
      };
      const response = await httpClient.sendRequest<Record<string, unknown>>(
        request
      );
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'List or destination board not found. Verify the list_id and board_id.'
      );
    }
  },
});
