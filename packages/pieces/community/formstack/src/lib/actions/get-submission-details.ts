import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import { formIdDropdown, submissionIdDropdown } from '../common/props';
import { formStackAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getSubmissionDetails = createAction({
  auth: formStackAuth,
  name: 'getSubmissionDetails',
  displayName: 'Get Submission Details',
  description: 'Get details of a form submission',
  props: {
    form_id: formIdDropdown,
    submission_id: submissionIdDropdown,
    encryption_password: Property.ShortText({
      displayName: 'Encryption Password',
      description: 'Password for encrypted forms',
      required: false,
    }),
    include_metadata: Property.Checkbox({
      displayName: 'Include Technical Metadata',
      description: 'Include IP, user agent, and location data',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const authentication = context.auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];
    
    const {
      form_id,
      submission_id,
      encryption_password,
      include_metadata,
    } = context.propsValue;

    try {
      const queryParams: Record<string, string> = {};
      if (encryption_password) {
        queryParams['encryption_password'] = encryption_password;
      }

      const response = await makeRequest(
        accessToken,
        HttpMethod.GET,
        `/submission/${submission_id}.json`,
        {},
        queryParams
      );

      const formattedData: Record<string, any> = {};
      
      if (response.data && Array.isArray(response.data)) {
        for (const item of response.data) {
          if (item.field && item.value !== undefined) {
            formattedData[`field_${item.field}`] = item.value;
          }
        }
      }

      const result = {
        submission: {
          id: response.id,
          form_id: response.form,
          submitted_at: response.timestamp,
          data: formattedData,
          raw_data: response.data,
        },
        form_data_count: response.data ? response.data.length : 0,
        success: true,
        message: `Successfully retrieved submission ${submission_id} from form ${form_id}`,
      };

      if (include_metadata) {
        (result.submission as any).metadata = {
          user_agent: response.user_agent,
          ip_address: response.remote_addr,
          latitude: response.latitude,
          longitude: response.longitude,
          portal_info: response.portal_name ? {
            portal_name: response.portal_name,
            portal_form_name: response.portal_form_name,
            participant_email: response.portal_participant_email,
          } : null,
        };
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        return {
          success: false,
          error: 'submission_not_found',
          message: `Submission with ID "${submission_id}" was not found. Please check the submission ID and try again.`,
          submission_id,
          form_id,
        };
      }
      
      if (errorMessage.includes('403') || errorMessage.includes('unauthorized')) {
        return {
          success: false,
          error: 'access_denied',
          message: `Access denied to submission "${submission_id}". You may not have permission to view this submission.`,
          submission_id,
          form_id,
        };
      }

      if (errorMessage.includes('encryption')) {
        return {
          success: false,
          error: 'encryption_required',
          message: `This submission is encrypted and requires a decryption password. Please provide the encryption password and try again.`,
          submission_id,
          form_id,
        };
      }

      return {
        success: false,
        error: 'retrieval_failed',
        message: `Failed to retrieve submission "${submission_id}": ${errorMessage}`,
        submission_id,
        form_id,
      };
    }
  },
});
