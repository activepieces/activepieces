import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const addMemberToCard = createAction({
  auth: trelloAuth,
  name: 'add_member_to_card',
  displayName: 'Add Member To Card (Agent)',
  description: 'Assign a member to a Trello card.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Assigns a member to a Trello card. Obtain card_id from Search Cards and member_id from Search Members or List Board Members. Re-adding an already-assigned member converges to the same member set (Trello returns the full member list rather than a clean no-op), so it is idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
    member_id: Property.ShortText({
      displayName: 'Member ID',
      description:
        'The member id to assign. Obtain it from Search Members or List Board Members.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/idMembers`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, {
          value: context.propsValue['member_id'],
        }),
      };
      const response = await httpClient.sendRequest(request);
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card or member not found. Verify the card_id and member_id.'
      );
    }
  },
});
