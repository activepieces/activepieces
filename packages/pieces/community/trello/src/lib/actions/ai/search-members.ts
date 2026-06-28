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

export const searchMembers = createAction({
  auth: trelloAuth,
  name: 'search_members',
  displayName: 'Search Members (Agent)',
  description: 'Find Trello members by name or username.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Trello members by name or username and returns matches with their member ids. Use it to resolve a person to a member_id before assigning them with Add Member To Card. Optionally restrict to a board or to organization members. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Name or username to search for.',
      required: true,
    }),
    board_id: Property.ShortText({
      displayName: 'Board ID',
      description: 'Restrict the search to members of this board (optional).',
      required: false,
    }),
    only_org_members: Property.Checkbox({
      displayName: 'Only Organization Members',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of members to return (1-20, default 8).',
      required: false,
    }),
  },

  async run(context) {
    const params: QueryParams = { query: context.propsValue['query'] };
    if (context.propsValue['board_id']) {
      params['idBoard'] = context.propsValue['board_id'] as string;
    }
    if (context.propsValue['only_org_members']) {
      params['onlyOrgMembers'] = 'true';
    }
    if (context.propsValue['limit']) {
      params['limit'] = String(context.propsValue['limit']);
    }

    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}search/members`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, params),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const members = response.body ?? [];
      return { members, count: members.length };
    } catch (error: any) {
      rethrowTrelloError(error, 'Board not found. Verify the board_id.');
    }
  },
});
