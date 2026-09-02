import { createAction } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { formioCommon } from '../common/client';
import { formioProps } from '../common/props';

export const deleteSubmission = createAction({
  auth: formioAuth,
  name: 'delete_submission',
  displayName: 'Delete Submission',
  description: 'Delete a submission by its id',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Deletes a Form.io submission by its id. Destructive and not recoverable through this piece, so confirm the id before calling it. Deleting an already-deleted submission has no further effect.',
    idempotent: true,
  },
  props: {
    formPath: formioProps.formPath,
    submissionId: formioProps.submissionId,
  },
  async run({ auth, propsValue }) {
    return await formioCommon.deleteSubmission({
      auth: auth.props,
      formPath: propsValue.formPath,
      submissionId: propsValue.submissionId,
    });
  },
});
