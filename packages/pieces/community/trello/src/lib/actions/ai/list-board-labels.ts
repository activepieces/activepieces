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
import { listBoardLabelsActionOutputSchema } from '../../output-schemas';

export const listBoardLabels = createAction({
  auth: trelloAuth,
  name: 'list_board_labels',
  displayName: 'List Board Labels (Agent)',
  description: "List a board's labels.",
  audience: 'ai',
  outputSchema: listBoardLabelsActionOutputSchema,
  aiMetadata: {
    description:
      "Lists the labels defined on a Trello board, returning each label id, name, and color. Use it to resolve a label_id for Add Label To Card / Remove Label From Card. Obtain board_id from List Boards. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description: 'The ID of the board. Obtain it from List Boards.',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of labels to return (1-1000, default 50).',
      required: false,
    }),
  },

  async run(context) {
    const params: QueryParams = {};
    if (context.propsValue['limit']) {
      params['limit'] = String(context.propsValue['limit']);
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}boards/${context.propsValue['board_id']}/labels`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const labels = response.body ?? [];
      return { labels, count: labels.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Board not found. Verify the board_id (resolve it via List Boards).'
      );
    }
  },
});
