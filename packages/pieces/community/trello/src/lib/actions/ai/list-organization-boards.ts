import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const listOrganizationBoards = createAction({
  auth: trelloAuth,
  name: 'list_organization_boards',
  displayName: 'List Organization Boards (Agent)',
  description: 'List the boards in a Trello workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the boards in a Trello workspace (organization), returning each board id and name. Use it when you have an org_id and want only that workspace\'s boards; for all boards you can access, use List Boards instead. Obtain org_id from Get My Member or List Boards. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    org_id: Property.ShortText({
      displayName: 'Organization ID',
      description:
        'The workspace (organization) id. Obtain it from Get My Member or a board\'s details.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}organizations/${context.propsValue['org_id']}/boards`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const boards = response.body ?? [];
      return { boards, count: boards.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Organization not found. Verify the org_id.'
      );
    }
  },
});
