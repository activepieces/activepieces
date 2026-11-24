import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCreateQuestionOutputSchema } from '../../../output-schemas';

export const createQuestionAction = createAction({
  auth: podioAuth,
  name: 'podio_create_question',
  outputSchema: podioCreateQuestionOutputSchema,
  displayName: 'Create Question',
  description: 'Adds a question with answer options to a status update or comment.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a question (a poll with fixed answer options) to one Podio status update or comment. Each call adds another question. The status id comes from Get Status or the stream actions, the comment id from Get Comment; the new question id goes to Answer Question and Get Question Answers.',
    idempotent: false,
  },
  props: {
    refType: podioAiProps.choice({ required: true, displayName: 'Object Type', description: 'The type of the object the question goes on: "status" or "comment".', values: ['status', 'comment'] }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the status (from Get Status or the stream) or comment (from Get Comment).' }),
    text: podioAiProps.text({ required: true, displayName: 'Question', description: 'The text of the question.' }),
    options: podioAiProps.idList({ required: true, displayName: 'Options', description: 'The answer options, one text per option.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/question/${propsValue.refType}/${propsValue.refId}/`, body: { text: propsValue.text, options: propsValue.options } });
  },
});
