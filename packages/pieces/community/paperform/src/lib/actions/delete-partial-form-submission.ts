import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { PaperformPartialSubmission } from '../common/types';
import { paperformCommonProps } from '../common/props';

export const deletePartialFormSubmission = createAction({
  auth: paperformAuth,
  name: 'deletePartialFormSubmission',
  displayName: 'Delete Partial Form Submission',
  description: 'Deletes a partial/in-progress submission by its ID.',
  props: {
    formId: paperformCommonProps.formId,
    partialSubmissionId: Property.Dropdown({
      displayName: 'Partial Submission ID',
      required: true,
      refreshers: ['auth', 'formId'],
      options: async ({ auth, formId }) => {
        if (!auth || !formId) {
          return {
            disabled: true,
            placeholder: 'Please select a form first',
            options: [],
          };
        }
        
        try {
          const partialSubmissions = await paperformCommon.getPartialSubmissions({
            formSlugOrId: formId as string,
            auth: auth as string,
            limit: 100,
          });
          
          return {
            disabled: false,
            options: partialSubmissions.results["partial-submissions"].map((partialSubmission: PaperformPartialSubmission) => ({
              label: `${partialSubmission.id}`,
              value: partialSubmission.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading partial submissions',
            options: [],
          };
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { partialSubmissionId } = propsValue;
    
    try {
      await paperformCommon.apiCall({
        method: HttpMethod.DELETE,
        url: `/partial-submissions/${partialSubmissionId}`,
        auth: auth as string,
      });
      
      return {
        success: true,
        message: `Partial submission with ID ${partialSubmissionId} has been successfully deleted.`,
      };
    } catch (error: any) {
      throw new Error(`Failed to delete partial submission: ${error.message}`);
    }
  },
});
