import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tldvCommon } from './client';
import { tldvAuth } from './auth';

export const meetingIdProperty = Property.Dropdown({
  displayName: 'Meeting',
  description: 'Select a meeting',
  auth: tldvAuth,
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }

    try {
      const response = await tldvCommon.apiCall<{
        results: Array<{
          id: string;
          name: string;
          happenedAt?: string;
        }>;
      }>({
        method: HttpMethod.GET,
        url: '/v1alpha1/meetings?limit=100',
        auth: { apiKey: auth.secret_text },
      });

      if (response.results && response.results.length > 0) {
        return {
          disabled: false,
          options: response.results.map((meeting) => ({
            label: `${meeting.name}${meeting.happenedAt ? ` (${new Date(meeting.happenedAt).toLocaleDateString()})` : ''}`,
            value: meeting.id,
          })),
        };
      }

      return {
        disabled: true,
        placeholder: 'No meetings found',
        options: [],
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading meetings',
        options: [],
      };
    }
  },
});

