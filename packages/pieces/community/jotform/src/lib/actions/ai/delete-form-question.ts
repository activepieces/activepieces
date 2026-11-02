import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformDeleteFormQuestionOutputSchema } from '../../output-schemas';

export const deleteFormQuestion = createAction({
  auth: jotformAuth,
  name: 'jotform_delete_form_question',
  outputSchema: jotformDeleteFormQuestionOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Form Question',
  description: 'Delete a question from a form.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a question from a form. Pairs with Add Form Question. Not idempotent — deleting an already-removed question fails.',
    idempotent: false,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
    questionId: Property.ShortText({
      displayName: 'Question ID',
      description: 'The ID of the question to delete, from List Form Questions.',
      required: true,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.DELETE,
      path: `/form/${context.propsValue.formId}/question/${context.propsValue.questionId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
