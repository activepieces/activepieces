import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetQuestionAnswersOutputSchema } from '../../../output-schemas';

export const getQuestionAnswersAction = createAction({
  auth: podioAuth,
  name: 'podio_get_question_answers',
  outputSchema: podioGetQuestionAnswersOutputSchema,
  displayName: 'Get Question Answers',
  description: 'Lists the answers given to a question on a status or comment.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists who answered one Podio question (a poll on a status update or comment) and which option each user picked. The question id comes from Create Question or from the questions on Get Status or Get Comment.',
    idempotent: true,
  },
  props: {
    questionId: podioAiProps.id({ required: true, displayName: 'Question ID', description: 'The id of the question.' }),
  },
  async run({ auth, propsValue }) {
    const answers = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/question/${propsValue.questionId}/` });
    return { answers, count: answers.length };
  },
});
