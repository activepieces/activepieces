import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { deleteBoardActionOutputSchema } from '../../output-schemas';

export const deleteBoard = createAction({
  auth: trelloAuth,
  name: 'delete_board',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Board (Agent)',
  description:
    'Permanently delete a board and everything on it. This cannot be undone.',
  audience: 'ai',
  outputSchema: deleteBoardActionOutputSchema,
  aiMetadata: {
    description:
      'Permanently deletes a board together with every list, card, comment and attachment on it. This is irreversible: Trello offers no way to restore a deleted board, and the data is gone for every member of the board, not just the connected user. Prefer Archive Board, which hides the board and can be undone, and only use this when permanent destruction is explicitly intended. Confirm the board with Get Board first, since a board id that belongs to the wrong board destroys the wrong data. Deleting an already-deleted board errors rather than succeeding, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description:
        'The ID of the board to permanently delete. Obtain it from List Boards and confirm it with Get Board first.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${trelloCommon.baseUrl}boards/${context.propsValue['board_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      await httpClient.sendRequest(request);
      return { success: true, board_id: context.propsValue['board_id'] };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Board not found. Verify the board_id (resolve it via List Boards).'
      );
    }
  },
});
