import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const listBoardCustomFields = createAction({
  auth: trelloAuth,
  name: 'list_board_custom_fields',
  classification: 'SEARCH',
  displayName: 'List Board Custom Fields (Agent)',
  description: "List the custom fields defined on a board.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the custom fields defined on a board, returning each field id, name and type. Use it to resolve a custom_field_id before reading or writing a card value with List Card Custom Field Values or Set Card Custom Field Value. Custom fields need the Custom Fields Power-Up enabled on the board; obtain board_id from List Boards. Read-only and idempotent.',
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
        url: `${trelloCommon.baseUrl}boards/${context.propsValue['board_id']}/customFields`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const custom_fields = response.body ?? [];
      return { custom_fields, count: custom_fields.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Board not found. Verify the board_id (resolve it via List Boards).'
      );
    }
  },
});
