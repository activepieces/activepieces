import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformDeleteFormQuestionOutputSchema } from '../../output-schemas';

export const deleteSubmission = createAction({
  auth: jotformAuth,
  name: 'jotform_delete_submission',
  outputSchema: jotformDeleteFormQuestionOutputSchema,
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Submission',
  description: 'Delete a submission.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a submission. Pairs with Create Form Submission. Not idempotent — deleting an already-removed submission fails.',
    idempotent: false,
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
      method: HttpMethod.DELETE,
      path: `/submission/${context.propsValue.submissionId}`,
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
    });
  },
});
