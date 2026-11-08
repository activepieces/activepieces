import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetResultOfVotingOnItemOutputSchema } from '../../../output-schemas';

export const getResultOfVotingOnItemAction = createAction({
  auth: podioAuth,
  name: 'podio_get_result_of_voting_on_item',
  outputSchema: podioGetResultOfVotingOnItemOutputSchema,
  displayName: 'Get Result of Voting on Item',
  description: 'Gets the result of one voting on an item.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the result of one voting on one Podio item, with the votes per value and some voters. For every voting of the app at once use Get Item Voting Results. The item id comes from Filter Items and the voting id from Get App Votings.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items or Get Item.' }),
    votingId: podioAiProps.id({ required: true, displayName: 'Voting ID', description: 'The id of the voting, from Get App Votings or Create Voting.' }),
    maxVoters: podioAiProps.number({ required: false, displayName: 'Max Voters', description: 'Maximum number of voters returned per result. Defaults to 23.' }),
  },
  async run({ auth, propsValue }) {
    const { itemId, votingId, maxVoters } = propsValue;
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/voting/item/${itemId}/voting/${votingId}/result`,
      query: podioUtils.query({ values: { max_voters: maxVoters } }),
    });
  },
});
