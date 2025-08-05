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
        auth: auth as string,
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
