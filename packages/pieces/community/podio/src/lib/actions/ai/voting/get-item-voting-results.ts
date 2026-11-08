import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetItemVotingResultsOutputSchema } from '../../../output-schemas';

export const getItemVotingResultsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_item_voting_results',
  outputSchema: podioGetItemVotingResultsOutputSchema,
  displayName: 'Get Item Voting Results',
  description: 'Gets the results of every app voting on an item.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the results of all votings of the app on one Podio item, keyed by voting id. For a single voting use Get Result of Voting on Item. The item id comes from Filter Items.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items or Get Item.' }),
    maxVoters: podioAiProps.number({ required: false, displayName: 'Max Voters', description: 'Maximum number of voters returned per result. Defaults to 23.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/voting/item/${propsValue.itemId}/result`,
      query: podioUtils.query({ values: { max_voters: propsValue.maxVoters } }),
    });
  },
});
