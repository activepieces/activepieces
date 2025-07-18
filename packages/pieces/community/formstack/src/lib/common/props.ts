import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const formIdDropdown = Property.Dropdown({
  displayName: 'Forms ',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }
    const authentication = auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];

    const forms = await makeRequest(
      accessToken,
      HttpMethod.GET,
      '/form.json'
    );
    const options = forms.forms.map((field: { id: string; name: string }) => {
      return {
        label: field.name,
        value: field.id,
      };
    });

    return {
      options,
    };
  },
});

export const submissionIdDropdown = Property.Dropdown({
  displayName: 'Submission',
  required: true,
  refreshers: ['auth', 'form_id'],
  options: async ({ auth, form_id }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }
    if (!form_id) {
      return {
        disabled: true,
        placeholder: 'Please select a form first',
        options: [],
      };
    }
    const authentication = auth as OAuth2PropertyValue;
    const accessToken = authentication['access_token'];

    try {
      const response = await makeRequest(
        accessToken,
        HttpMethod.GET,
        `/form/${form_id}/submission.json`
      );

      if (!response.submissions || response.submissions.length === 0) {
        return {
          disabled: true,
          placeholder: 'No submissions found for this form',
          options: [],
        };
      }

      const options = response.submissions.map((submission: any) => {
        let label = `ID: ${submission.id}`;
        
        if (submission.timestamp) {
          const date = new Date(submission.timestamp).toLocaleDateString();
          label += ` (${date})`;
        }

        if (submission.data && Array.isArray(submission.data) && submission.data.length > 0) {
          const previewFields = submission.data
            .slice(0, 2)
            .map((field: any) => {
              if (field.value && typeof field.value === 'string' && field.value.length > 0) {
                const value = field.value.length > 20 
                  ? field.value.substring(0, 20) + '...' 
                  : field.value;
                return value;
              }
              return null;
            })
            .filter(Boolean);

          if (previewFields.length > 0) {
            label += ` - ${previewFields.join(', ')}`;
          }
        }

        return {
          label,
          value: submission.id,
        };
      });

      return {
        options,
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading submissions',
        options: [],
      };
    }
  },
});
