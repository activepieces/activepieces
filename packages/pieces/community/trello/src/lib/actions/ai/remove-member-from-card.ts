import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { removeMemberFromCardActionOutputSchema } from '../../output-schemas';

export const removeMemberFromCard = createAction({
  auth: trelloAuth,
  name: 'remove_member_from_card',
  displayName: 'Remove Member From Card (Agent)',
  description: 'Unassign a member from a Trello card.',
  audience: 'ai',
  outputSchema: removeMemberFromCardActionOutputSchema,
  aiMetadata: {
    description:
      'Unassigns a member from a Trello card. Obtain card_id from Search Cards and member_id from List Card Members. Removing an already-absent member converges to the same state, so it is idempotent.',
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
        'The member id to unassign. Obtain it from List Card Members.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/idMembers/${context.propsValue['member_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
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
