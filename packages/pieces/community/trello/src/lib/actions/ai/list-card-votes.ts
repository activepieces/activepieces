import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { trelloAuth } from '../../..';
import { withAuthParams, rethrowTrelloError } from './ai-common';
import { listCardVotesActionOutputSchema } from '../../output-schemas';

export const listCardVotes = createAction({
  auth: trelloAuth,
  name: 'list_card_votes',
  classification: 'SEARCH',
  displayName: 'List Card Votes (Agent)',
  description: 'List the members who voted on a card.',
  audience: 'ai',
  outputSchema: listCardVotesActionOutputSchema,
  aiMetadata: {
    description:
      'Lists the members who have voted on a card, returning each member id and username, with the count as the vote tally. Use it to rank cards by support, or to check whether a member has already voted before calling Vote On Card or Remove Card Vote. Requires the Voting Power-Up on the board. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    card_id: Property.ShortText({
      displayName: 'Card ID',
      description: 'The ID of the card. Obtain it from Search Cards.',
      required: true,
    }),
  },

  async run(context) {
    try {
      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}/membersVoted`,
        headers: { Accept: 'application/json' },
        queryParams: withAuthParams(context.auth),
      };
      const response = await httpClient.sendRequest<
        Array<Record<string, unknown>>
      >(request);
      const voters = response.body ?? [];
      return { voters, count: voters.length };
    } catch (error: any) {
      rethrowTrelloError(
        error,
        'Card not found. Verify the card_id (resolve it via Search Cards).'
      );
    }
  },
});
