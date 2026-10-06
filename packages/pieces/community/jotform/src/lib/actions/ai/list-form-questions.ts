import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformListFormQuestionsOutputSchema } from '../../output-schemas';

export const listFormQuestions = createAction({
  auth: jotformAuth,
  name: 'jotform_list_form_questions',
  outputSchema: jotformListFormQuestionsOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Form Questions',
  description: "List a form's questions (fields).",
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists a form's questions, each with its question ID, type, text, field name, order and required flag. Use the returned question ID with the other question actions.",
    idempotent: true,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: `/form/${context.propsValue.formId}/questions`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
