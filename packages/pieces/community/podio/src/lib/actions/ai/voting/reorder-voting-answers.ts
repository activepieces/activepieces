import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const reorderVotingAnswersAction = createAction({
  auth: podioAuth,
  name: 'podio_reorder_voting_answers',
  displayName: 'Reorder Voting Answers',
  description: 'Sets the display order of the answers in a voting.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the order in which the answers of an answer-type Podio voting are shown. The voting id comes from Get App Votings and the answer ids from Get Voting.',
    idempotent: true,
  },
  props: {
    votingId: podioAiProps.id({ required: true, displayName: 'Voting ID', description: 'The id of the voting, from Get App Votings or Create Voting.' }),
    answerIds: podioAiProps.idList({ required: true, displayName: 'Answer IDs', description: 'The ids of the voting answers in the wanted order, from Get Voting.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/voting/${propsValue.votingId}/answer/order`,
      body: { answer_ids: propsValue.answerIds.map((answerId) => Number(answerId)) },
    });
  },
});
