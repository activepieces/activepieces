import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';

export const removeCardVote = createAction({
  auth: trelloAuth,
  name: 'remove_card_vote',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Card Vote (Agent)',
  description: "Remove a member's vote from a card.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Removes one member's vote from a card. Use it to undo a vote cast by Vote On Card; check List Card Votes first to confirm the member actually voted, because removing a vote that was never cast returns an error rather than succeeding. Requires the Voting Power-Up on the board. Not idempotent.",
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
        'The ID of the member whose vote is removed. Obtain it from List Card Votes.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/membersVoted/${context.propsValue['member_id']}`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      await httpClient.sendRequest(request);
      return {
        success: true,
        card_id: context.propsValue['card_id'],
        member_id: context.propsValue['member_id'],
      };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card or vote not found. Verify the card_id and member_id, and that the member has actually voted (check List Card Votes).'
      );
    }
  },
});
