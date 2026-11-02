import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetFormQuestionOutputSchema } from '../../output-schemas';

export const getFormQuestion = createAction({
  auth: jotformAuth,
  name: 'jotform_get_form_question',
  outputSchema: jotformGetFormQuestionOutputSchema,
  classification: 'READ',
  displayName: 'Get Form Question',
  description: "Get a single form question's detail.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns a single question's detail: type, text, field name, order and required flag. Use List Form Questions to find the question ID.",
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
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: `/form/${context.propsValue.formId}/question/${context.propsValue.questionId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
