import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetSubmissionOutputSchema } from '../../output-schemas';

export const getSubmission = createAction({
  auth: jotformAuth,
  name: 'jotform_get_submission',
  outputSchema: jotformGetSubmissionOutputSchema,
  classification: 'READ',
  displayName: 'Get Submission',
  description: 'Get a single submission by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns a single submission's detail: status, created date and answers keyed by question ID, each with its text, answer and type.",
    idempotent: true,
  },
  props: {
    submissionId: Property.ShortText({
      displayName: 'Submission ID',
      description: 'The ID of the submission, from List Form Submissions.',
      required: true,
    }),
  },
  async run(context) {
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: `/submission/${context.propsValue.submissionId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
