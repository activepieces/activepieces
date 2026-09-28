import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformBulkReplaceFormQuestionsOutputSchema } from '../../output-schemas';

export const bulkReplaceFormQuestions = createAction({
  auth: jotformAuth,
  name: 'jotform_bulk_replace_form_questions',
  outputSchema: jotformBulkReplaceFormQuestionsOutputSchema,
  classification: 'WRITE',
  displayName: 'Bulk Replace Form Questions',
  description: "Bulk-replace all of a form's questions from a JSON array.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Replaces a form's questions from a JSON array of question objects. Each entry with a \"qid\" replaces that existing question in place; entries with no qid are appended as new questions numbered from the array position. Not a merge — read the form's current questions first if any should be kept. Not idempotent — every call rewrites the question set.",
    idempotent: false,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
    questions: Property.Json({
      displayName: 'Questions',
      description: 'JSON array of question objects to replace the form\'s questions with.',
      required: true,
    }),
  },
  async run(context) {
    const { formId, questions } = context.propsValue;
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('questions must be a non-empty array.');
    }
    const keyedQuestions: Record<string, unknown> = {};
    questions.forEach((question, index) => {
      const qid =
        typeof question === 'object' && question !== null && 'qid' in question
          ? String((question as Record<string, unknown>)['qid'])
          : String(index + 1);
      keyedQuestions[qid] = question;
    });
    return jotformCommon.request({
      method: HttpMethod.PUT,
      path: `/form/${formId}/questions`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body: { questions: keyedQuestions },
    });
  },
});
