import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const archiveBoard = createAction({
  auth: trelloAuth,
  name: 'archive_board',
  displayName: 'Archive Board (Agent)',
  description: 'Close (archive) or reopen a Trello board.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Closes (archives, closed=true) or reopens (closed=false) a Trello board identified by board_id. Archiving is recoverable; prefer this over permanently deleting a board. Obtain board_id from List Boards. Setting the same closed state again converges, so it is idempotent.',
    idempotent: true,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description: 'The ID of the board. Obtain it from List Boards.',
      required: true,
    }),
    closed: Property.Checkbox({
      displayName: 'Closed',
      description: 'True to close (archive) the board, false to reopen it.',
      required: false,
      defaultValue: true,
    }),
  },

  async run(context) {
    const closed = context.propsValue['closed'] ?? true;
    try {
      const request: HttpRequest = {
        method: HttpMethod.PUT,
        url: `${trelloCommon.baseUrl}boards/${context.propsValue['board_id']}/closed`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, {
          value: closed ? 'true' : 'false',
        }),
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
