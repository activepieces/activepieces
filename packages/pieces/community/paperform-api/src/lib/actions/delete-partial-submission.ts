import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon, PaperformAuth } from '../auth';
import { paperformApiAuth } from '@activepieces/piece-paperform-api';

export const deletePartialSubmissionAction = createAction({
  displayName: 'Delete Partial Form Submission',
  name: 'delete_partial_submission',
  description: 'Permanently delete a partial/in-progress submission by its ID',
  props: {
    partialSubmissionId: Property.ShortText({
      displayName: 'Partial Submission ID',
      description: 'The ID of the partial submission to delete',
      required: true,
    }),
  },
  auth: paperformApiAuth,
  async run({ auth, propsValue }) {
    const paperformAuth: PaperformAuth = { auth: auth as string };
    
    const endpoint = `/partial-submissions/${propsValue.partialSubmissionId}`;
    const response = await paperformCommon.makeRequest(
      paperformAuth, 
      endpoint, 
      HttpMethod.DELETE
    );
    
    return {
      success: true,
      message: 'Partial submission deleted successfully',
      partialSubmissionId: propsValue.partialSubmissionId,
    };
  },
}); 