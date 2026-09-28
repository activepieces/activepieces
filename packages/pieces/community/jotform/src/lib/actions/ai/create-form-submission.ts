import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformCreateFormSubmissionOutputSchema } from '../../output-schemas';

export const createFormSubmission = createAction({
  auth: jotformAuth,
  name: 'jotform_create_form_submission',
  outputSchema: jotformCreateFormSubmissionOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Form Submission',
  description: 'Submit a form on behalf of a user.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Submits a form with the given answers, keyed by question ID, e.g. {"3":"John Doe"}. Returns the new submission ID. Not idempotent — each call creates a new submission.',
    idempotent: false,
  },
  props: {
    formId: Property.ShortText({
      displayName: 'Form ID',
      description: 'The ID of the form, from List Forms.',
      required: true,
    }),
    answers: Property.Json({
      displayName: 'Answers',
      description:
        'Key/value map of question ID to answer, e.g. {"3":"John Doe"}. Resolve question IDs with List Form Questions.',
      required: true,
    }),
  },
  async run(context) {
    const { formId, answers } = context.propsValue;
    if (typeof answers !== 'object' || answers === null || Array.isArray(answers)) {
      throw new Error('answers must be a JSON object of question ID to answer.');
    }
    const body: Record<string, unknown> = {};
    Object.entries(answers as Record<string, unknown>).forEach(([questionId, value]) => {
      body[`submission[${questionId}]`] = value;
    });
    return jotformCommon.request({
      method: HttpMethod.POST,
      path: `/form/${formId}/submissions`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      body,
      form: true,
    });
  },
});
