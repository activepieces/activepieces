import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { getMyMemberActionOutputSchema } from '../../output-schemas';

export const getMyMember = createAction({
  auth: trelloAuth,
  name: 'get_my_member',
  displayName: 'Get My Member (Agent)',
  description: 'Get the connected Trello user.',
  audience: 'ai',
  outputSchema: getMyMemberActionOutputSchema,
  aiMetadata: {
    description:
      'Returns the connected Trello user (id, username, full name). Use it to resolve "me" — your own member id — for assigning yourself to cards or as the member filter in List Boards. Takes no inputs. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}members/me`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Could not resolve the connected user. Check the connection token.'
      );
    }
  },
});
