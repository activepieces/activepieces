import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteAnswerInVotingAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_answer_in_voting',
  displayName: 'Delete Answer in Voting',
  description: 'Deletes an answer option from a voting.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one answer option from an answer-type Podio voting. The answer id comes from Get Voting or Get App Votings.',
    idempotent: false,
  },
  props: {
    answerId: podioAiProps.id({ required: true, displayName: 'Answer ID', description: 'The id of the answer, from the answers in Get Voting or Get App Votings.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/voting/answer/${propsValue.answerId}` });
  },
});
