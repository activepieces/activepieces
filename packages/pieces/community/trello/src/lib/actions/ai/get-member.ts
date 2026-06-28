import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const getMember = createAction({
  auth: trelloAuth,
  name: 'get_member',
  displayName: 'Get Member (Agent)',
  description: 'Get a Trello member by id or username.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieves a Trello member profile by member id or username. Obtain a member id from Search Members or List Board Members. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    member_id: Property.ShortText({
      displayName: 'Member ID or Username',
      description:
        'The member id or username. Obtain it from Search Members or List Board Members.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}members/${context.propsValue['member_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Member not found. Verify the member id or username (resolve it via Search Members).'
      );
    }
  },
});
