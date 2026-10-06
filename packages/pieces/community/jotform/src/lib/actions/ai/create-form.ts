import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformBulkReplaceFormsOutputSchema } from '../../output-schemas';

export const createForm = createAction({
  auth: jotformAuth,
  name: 'jotform_create_form',
  outputSchema: jotformBulkReplaceFormsOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Form',
  description: 'Create a new form with a title and a set of questions.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new form with the given title and question list (each question is a Jotform question object, e.g. {"type":"control_textbox","text":"Name"}). Returns the new form ID. Not idempotent — each call creates a new form.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the new form.',
      required: true,
    }),
    questions: Property.Json({
      displayName: 'Questions',
      description:
        'Array of Jotform question objects to add to the form, e.g. [{"type":"control_textbox","text":"Name"}].',
      required: false,
    }),
  },
  async run(context) {
    const { title, questions } = context.propsValue;
    const body: Record<string, unknown> = {
      'properties[title]': title,
    };
    if (questions !== undefined) {
      const questionList = Array.isArray(questions) ? questions : [questions];
      questionList.forEach((question, index) => {
        if (typeof question !== 'object' || question === null || Array.isArray(question)) {
          throw new Error('each question must be a JSON object.');
        }
        Object.entries(question as Record<string, unknown>).forEach(([field, value]) => {
          jotformCommon.flattenForForm(`questions[${index}][${field}]`, value, body);
        });
      });
    }
    return jotformCommon.request({
      method: HttpMethod.POST,
      path: '/user/forms',
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body,
      form: true,
    });
  },
});
