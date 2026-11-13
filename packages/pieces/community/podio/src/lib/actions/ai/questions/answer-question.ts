import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const answerQuestionAction = createAction({
  auth: podioAuth,
  name: 'podio_answer_question',
  displayName: 'Answer Question',
  description: 'Answers a question on a status or comment by picking one of its options.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Answers one Podio question (a poll on a status update or comment) for the connected user by picking one of its options. The question id and option ids come from the questions on Get Status or Get Comment.',
    idempotent: false,
  },
  props: {
    questionId: podioAiProps.id({ required: true, displayName: 'Question ID', description: 'The id of the question.' }),
    questionOptionId: podioAiProps.id({ required: true, displayName: 'Option ID', description: 'The id of the option to pick, from the question options on Get Status or Get Comment.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/question/${propsValue.questionId}/`, body: { question_option_id: Number(propsValue.questionOptionId) } });
  },
});
