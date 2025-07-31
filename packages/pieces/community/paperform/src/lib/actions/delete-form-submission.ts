import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { PaperformSubmission } from '../common/types';

export const deleteFormSubmission = createAction({
  auth: paperformAuth,
  name: 'deleteFormSubmission',
  displayName: 'Delete Form Submission',
  description: 'Permanently delete a completed submission by its ID.',
  props: {
    formId: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to get submissions from',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        
        try {
          const forms = await paperformCommon.getForms({
            auth: auth as string,
            limit: 100,
          });
          
          return {
            disabled: false,
            options: forms.results.forms.map((form) => ({
              label: form.title,
              value: form.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading forms',
            options: [],
          };
        }
      },
    }),
    submissionId: Property.Dropdown({
      displayName: 'Submission',
      description: 'Select the submission to delete',
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
          const submissions = await paperformCommon.getSubmissions({
            formId: formId as string,
            auth: auth as string,
            limit: 100,
          });
          
          return {
            disabled: false,
            options: submissions.results.submissions.map((submission: PaperformSubmission) => ({
              label: `${submission.id}`,
              value: submission.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading submissions',
            options: [],
          };
        }
      },
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
