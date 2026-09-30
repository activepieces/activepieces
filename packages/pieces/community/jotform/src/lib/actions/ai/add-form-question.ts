import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformAddFormQuestionOutputSchema } from '../../output-schemas';

export const addFormQuestion = createAction({
  auth: jotformAuth,
  name: 'jotform_add_form_question',
  outputSchema: jotformAddFormQuestionOutputSchema,
  classification: 'WRITE',
  displayName: 'Add Form Question',
  description: 'Add one or more questions to a form.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one or more questions to an existing form, each a Jotform question object, e.g. {"type":"control_textbox","text":"Name"}. Not idempotent — each call adds new questions.',
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
      description:
        'Array of Jotform question objects to add, e.g. [{"type":"control_textbox","text":"Name"}].',
      required: true,
    }),
  },
  async run(context) {
    const { formId, questions } = context.propsValue;
    const questionList = Array.isArray(questions) ? questions : [questions];
    const results: unknown[] = [];
    for (const question of questionList) {
      if (typeof question !== 'object' || question === null || Array.isArray(question)) {
        throw new Error('each question must be a JSON object.');
      }
      const body: Record<string, unknown> = {};
      Object.entries(question as Record<string, unknown>).forEach(([field, value]) => {
        jotformCommon.flattenForForm(`question[${field}]`, value, body);
      });
      results.push(
        await jotformCommon.request({
          method: HttpMethod.POST,
          path: `/form/${formId}/questions`,
          apiKey: context.auth.props.apiKey,
          region: context.auth.props.region,
          body,
          form: true,
        })
      );
    }
    return results;
  },
});
