import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioListVotersOutputSchema } from '../../../output-schemas';

export const listVotersAction = createAction({
  auth: podioAuth,
  name: 'podio_list_voters',
  outputSchema: podioListVotersOutputSchema,
  displayName: 'List Voters',
  description: 'Lists the users who voted on an item in a voting.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the profiles of users who voted on one Podio item in one voting, optionally only those who gave a given value. For the totals use Get Result of Voting on Item. The item id comes from Filter Items and the voting id from Get App Votings.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items or Get Item.' }),
    votingId: podioAiProps.id({ required: true, displayName: 'Voting ID', description: 'The id of the voting, from Get App Votings or Create Voting.' }),
    value: podioAiProps.id({ required: false, displayName: 'Value', description: 'Only voters who gave this value: 1 to 5 for a fivestar voting, an answer id from Get Voting for an answer voting. Leave empty for all voters.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of voters to return. Defaults to 20.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { itemId, votingId, value, limit, offset } = propsValue;
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/voting/item/${itemId}/voting/${votingId}/user`,
      query: podioUtils.query({ values: { value, limit: limit ?? 20, offset } }),
    });
    return { users: body, count: body.length };
  },
});
