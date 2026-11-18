import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCreateVotingOutputSchema } from '../../../output-schemas';

export const updateVotingAction = createAction({
  auth: podioAuth,
  name: 'podio_update_voting',
  outputSchema: podioCreateVotingOutputSchema,
  displayName: 'Update Voting',
  description: 'Changes the question of a voting.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the question of one Podio voting; its kind and answers stay (use the answer actions for those). The voting id comes from Get App Votings or Create Voting.',
    idempotent: true,
  },
  props: {
    votingId: podioAiProps.id({ required: true, displayName: 'Voting ID', description: 'The id of the voting, from Get App Votings or Create Voting.' }),
    question: podioAiProps.text({ required: true, displayName: 'Question', description: 'The new question of the voting.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: `/voting/${propsValue.votingId}`, body: { question: propsValue.question } });
  },
});
