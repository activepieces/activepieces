import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon, PaperformAuth } from '../auth';
import { paperformApiAuth } from '@activepieces/piece-paperform-api';

export const deleteSubmissionAction = createAction({
  displayName: 'Delete Form Submission',
  name: 'delete_submission',
  description: 'Permanently delete a completed submission by its ID',
  props: {
    submissionId: Property.ShortText({
      displayName: 'Submission ID',
      description: 'The ID of the submission to delete',
      required: true,
    }),
  },
  auth: paperformApiAuth,
  async run({ auth, propsValue }) {
    const paperformAuth: PaperformAuth = { auth: auth as string };
    
    const endpoint = `/submissions/${propsValue.submissionId}`;
    const response = await paperformCommon.makeRequest(
      paperformAuth, 
      endpoint, 
      HttpMethod.DELETE
    );
    
    return {
      success: true,
      message: 'Submission deleted successfully',
      submissionId: propsValue.submissionId,
    };
  },
}); 