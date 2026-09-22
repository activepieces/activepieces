import { createAction } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { formioCommon } from '../common/client';
import { formioProps } from '../common/props';
import { getSubmissionOutputSchema } from '../common/output-schemas';

export const getSubmission = createAction({
  auth: formioAuth,
  name: 'get_submission',
  displayName: 'Get Submission',
  description: 'Read one submission by its id',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Reads a single Form.io submission by its id, returning the submitted data along with its owner, timestamps and metadata. Use it to look up a record whose id you already have; prefer Find Submissions to search by field values. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: getSubmissionOutputSchema,
  props: {
    formPath: formioProps.formPath,
    submissionId: formioProps.submissionId,
  },
  async run({ auth, propsValue }) {
    return await formioCommon.getSubmission({
      auth: auth.props,
      formPath: propsValue.formPath,
      submissionId: propsValue.submissionId,
    });
  },
});
