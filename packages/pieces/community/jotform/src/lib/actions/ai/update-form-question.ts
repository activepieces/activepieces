import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformUpdateFormQuestionOutputSchema } from '../../output-schemas';

export const updateFormQuestion = createAction({
  auth: jotformAuth,
  name: 'jotform_update_form_question',
  outputSchema: jotformUpdateFormQuestionOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Form Question',
  description: "Update one question's properties.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a single question from a key/value map of question properties, e.g. {"text":"Full Name","required":"Yes"}. Only the supplied keys change; every other property is left alone. Idempotent — setting the same value again is a no-op.',
    idempotent: true,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
    questionId: Property.ShortText({
      displayName: 'Question ID',
      description: 'The ID of the question, from List Form Questions.',
      required: true,
    }),
    question: Property.Json({
      displayName: 'Question Properties',
      description:
        'Key/value map of question properties to update, e.g. {"text":"Full Name","required":"Yes"}.',
      required: true,
    }),
  },
  async run(context) {
    const { formId, questionId, question } = context.propsValue;
    if (typeof question !== 'object' || question === null || Array.isArray(question)) {
      throw new Error('question must be a JSON object of key/value pairs.');
    }
    const body: Record<string, unknown> = {};
    Object.entries(question as Record<string, unknown>).forEach(([field, value]) => {
      body[`question[${field}]`] = value;
    });
    return jotformCommon.request({
      method: HttpMethod.POST,
      path: `/form/${formId}/question/${questionId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body,
      form: true,
    });
  },
});
