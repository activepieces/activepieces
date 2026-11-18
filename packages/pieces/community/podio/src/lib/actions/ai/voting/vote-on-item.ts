import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const voteOnItemAction = createAction({
  auth: podioAuth,
  name: 'podio_vote_on_item',
  displayName: 'Vote on Item',
  description: 'Casts the connected user\'s vote on an item in a voting.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Casts the connected user\'s vote on one Podio item in one voting: set Rating (1 to 5) for a fivestar voting, or Answer ID for an answer voting, exactly one of them. Remove Vote undoes it. The item id comes from Filter Items, the voting and answer ids from Get App Votings.',
    idempotent: false,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items or Get Item.' }),
    votingId: podioAiProps.id({ required: true, displayName: 'Voting ID', description: 'The id of the voting, from Get App Votings or Create Voting.' }),
    rating: podioAiProps.number({ required: false, displayName: 'Rating', description: 'The rating from 1 to 5, for a fivestar voting.' }),
    answerId: podioAiProps.id({ required: false, displayName: 'Answer ID', description: 'The id of the chosen answer, for an answer voting, from Get Voting or Get App Votings.' }),
  },
  async run({ auth, propsValue }) {
    const { itemId, votingId, rating, answerId } = propsValue;
    const hasRating = rating !== undefined && rating !== null;
    const hasAnswer = answerId !== undefined && answerId !== null && answerId !== '';
    if (hasRating === hasAnswer) {
      throw new Error('Set exactly one of Rating (fivestar voting) and Answer ID (answer voting).');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/voting/item/${itemId}/voting/${votingId}/votes`,
      body: hasRating ? { rating } : { answer_id: Number(answerId) },
    });
  },
});
