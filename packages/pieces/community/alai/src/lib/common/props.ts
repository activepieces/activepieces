import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { alaiAuth } from './auth';

export const presentationId = Property.Dropdown({
  auth: alaiAuth,
  displayName: 'Presentation',
  description: 'Select a presentation',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) return { options: [] };
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://slides-api.getalai.com/api/v1/presentations',
      headers: {
        Authorization: `Bearer ${auth.props.apiKey}`,
        Accept: 'application/json',
      },
    });
    const presentations = response.body?.presentations || [];
    return {
      disabled: presentations.length === 0,
      options: presentations.map(
        (presentation: { presentation_id: string; title: string }) => ({
          label: presentation.title,
          value: presentation.presentation_id,
        })
      ),
    };
  },
});
