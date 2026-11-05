import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCreateAnswerInVotingOutputSchema } from '../../../output-schemas';

export const createAnswerInVotingAction = createAction({
  auth: podioAuth,
  name: 'podio_create_answer_in_voting',
  outputSchema: podioCreateAnswerInVotingOutputSchema,
  displayName: 'Create Answer in Voting',
  description: 'Adds an answer option to an answer-type voting.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds one answer option to an answer-type Podio voting. The voting id comes from Get App Votings or Create Voting.',
    idempotent: false,
  },
  props: {
    votingId: podioAiProps.id({ required: true, displayName: 'Voting ID', description: 'The id of the voting, from Get App Votings or Create Voting.' }),
    text: podioAiProps.text({ required: true, displayName: 'Answer Text', description: 'The text of the new answer.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/voting/${propsValue.votingId}/answers`, body: { text: propsValue.text } });
  },
});
