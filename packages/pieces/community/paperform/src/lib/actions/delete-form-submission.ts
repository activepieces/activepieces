import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommonProps } from '../common/props';

export const deleteFormSubmission = createAction({
  auth: paperformAuth,
  name: 'deleteFormSubmission',
  displayName: 'Delete Form Submission',
  description: 'Deletes a completed submission by its ID.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a completed Paperform submission, identified by its submission ID, from the given form. Use to remove a finished response; the deletion is destructive and not idempotent since the record no longer exists on repeat calls.', idempotent: false },
  props: {
    formId: paperformCommonProps.formId,
    submissionId: Property.ShortText({
      displayName: 'Form Submission ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { submissionId } = propsValue;

    try {
      await paperformCommon.apiCall({
        method: HttpMethod.DELETE,
        url: `/submissions/${submissionId}`,
        auth: auth.secret_text,
      });

      return {
        success: true,
        message: `Submission with ID ${submissionId} has been successfully deleted.`,
      };
    } catch (error: any) {
      throw new Error(`Failed to delete submission: ${error.message}`);
    }
  },
});
