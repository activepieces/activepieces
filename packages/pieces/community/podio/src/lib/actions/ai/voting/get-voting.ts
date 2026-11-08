import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCreateVotingOutputSchema } from '../../../output-schemas';

export const getVotingAction = createAction({
  auth: podioAuth,
  name: 'podio_get_voting',
  outputSchema: podioCreateVotingOutputSchema,
  displayName: 'Get Voting',
  description: 'Gets one voting with its question and answers.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio voting: its kind, question and answers with their ids. The voting id comes from Get App Votings or Create Voting.',
    idempotent: true,
  },
  props: {
    votingId: podioAiProps.id({ required: true, displayName: 'Voting ID', description: 'The id of the voting, from Get App Votings or Create Voting.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/voting/${propsValue.votingId}` });
  },
});
