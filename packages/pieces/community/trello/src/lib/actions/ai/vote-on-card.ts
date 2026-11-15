import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const voteOnCard = createAction({
  auth: trelloAuth,
  name: 'vote_on_card',
  classification: 'WRITE',
  displayName: 'Vote On Card (Agent)',
  description: 'Add a member vote to a card.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Records a vote on a card on behalf of a board member, whose id comes from Get My Member for the connected user or Search Members for someone else. Voting requires the Voting Power-Up to be enabled on the board, and the member must belong to the board. Voting again as the same member fails rather than doubling the vote, so treat it as not idempotent and use List Card Votes to check first.',
    idempotent: false,
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
        'The ID of the member casting the vote. Obtain it from Get My Member or Search Members.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/membersVoted`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth, {
          value: context.propsValue['member_id'],
        }),
      };
      const response = await httpClient.sendRequest<Record<string, unknown>>(
        request
      );
      return response.body;
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card or member not found. Verify the card_id and member_id, and that the Voting Power-Up is enabled on the board.'
      );
    }
  },
});
