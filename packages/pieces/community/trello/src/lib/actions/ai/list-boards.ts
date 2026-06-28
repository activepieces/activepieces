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

export const listBoards = createAction({
  auth: trelloAuth,
  name: 'list_boards',
  displayName: 'List Boards (Agent)',
  description: 'List the Trello boards you can access.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Trello boards the connected user can access, returning each board id and name. This is the top-level resolver: start here to get a board_id, then use List Lists / List Board Labels / List Board Members to drill down. Defaults to the connected user (member "me"). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    member_id: Property.ShortText({
      displayName: 'Member ID',
      description:
        'Whose boards to list. Defaults to the connected user ("me"). Obtain another member id from Search Members.',
      required: false,
    }),
    filter: Property.StaticDropdown({
      displayName: 'Filter',
      description: 'Which boards to include.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
          { label: 'All', value: 'all' },
        ],
      },
    }),
  },

  async run(context) {
    const memberId = (context.propsValue['member_id'] as string) || 'me';
    const params: QueryParams = {};
    if (context.propsValue['filter']) {
      params['filter'] = context.propsValue['filter'] as string;
    }
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}members/${memberId}/boards`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const boards = response.body ?? [];
      return { boards, count: boards.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Member not found. Verify the member_id, or omit it to list your own boards.'
      );
    }
  },
});
