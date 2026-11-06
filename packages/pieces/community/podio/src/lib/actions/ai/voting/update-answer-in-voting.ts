import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCreateAnswerInVotingOutputSchema } from '../../../output-schemas';

export const updateAnswerInVotingAction = createAction({
  auth: podioAuth,
  name: 'podio_update_answer_in_voting',
  outputSchema: podioCreateAnswerInVotingOutputSchema,
  displayName: 'Update Answer in Voting',
  description: 'Changes the text of an answer in a voting.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes the text of one answer option in an answer-type Podio voting; votes already cast on it stay. The answer id comes from Get Voting or Get App Votings.',
    idempotent: true,
  },
  props: {
    answerId: podioAiProps.id({ required: true, displayName: 'Answer ID', description: 'The id of the answer, from the answers in Get Voting or Get App Votings.' }),
    text: podioAiProps.text({ required: true, displayName: 'Answer Text', description: 'The new text of the answer.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.PUT, path: `/voting/answer/${propsValue.answerId}`, body: { text: propsValue.text } });
  },
});
