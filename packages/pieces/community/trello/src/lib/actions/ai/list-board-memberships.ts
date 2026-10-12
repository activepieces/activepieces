import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { listBoardMembershipsActionOutputSchema } from '../../output-schemas';

export const listBoardMemberships = createAction({
  auth: trelloAuth,
  name: 'list_board_memberships',
  classification: 'SEARCH',
  displayName: 'List Board Memberships (Agent)',
  description: "List a board's members together with their roles.",
  audience: 'ai',
  outputSchema: listBoardMembershipsActionOutputSchema,
  aiMetadata: {
    description:
      'Lists the members of a board with the role each one holds, such as admin, normal or observer, alongside their username. Use it when the role matters, for example before an action that needs board admin rights; List Board Members returns the same people without their roles. Read-only and idempotent.',
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
        url: `${trelloCommon.baseUrl}boards/${context.propsValue['board_id']}/memberships`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, {
          member: 'true',
          member_fields: 'username,fullName',
        }),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const memberships = response.body ?? [];
      return { memberships, count: memberships.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Board not found. Verify the board_id (resolve it via List Boards).'
      );
    }
  },
});
