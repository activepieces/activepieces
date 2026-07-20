import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { omnihrAuth } from '../auth';

export const generateReport = createAction({
  auth: omnihrAuth,
  name: 'generateReport',
  displayName: 'Generate Report',
  description: 'Generate Custom Report',
  audience: 'both',
  aiMetadata: {
    description:
      'Generates the data for an existing OmniHR custom report template and returns the rows as an array of objects. The fields present on each row depend on the columns configured in the selected template. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    reportTemplateId: Property.Dropdown({
      auth: omnihrAuth,
      displayName: 'Report Template',
      description: 'The custom report template to generate a report from',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }

        const headers = {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
          Origin: auth.props.origin,
        };

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://api.omnihr.co/api/v1/reports/custom/templates',
          headers,
        });

        const templates: Array<{ id: number; name: string }> = response.body;

        return {
          disabled: false,
          options: templates.map((template) => ({
            label: template.name,
            value: template.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const { reportTemplateId } = context.propsValue;
    const headers = {
      Authorization: `Bearer ${context.auth.access_token}`,
      'Content-Type': 'application/json',
      Origin: context.auth.props.origin,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.omnihr.co/api/v1/reports/custom/templates/${reportTemplateId}/generate-json`,
      headers,
    });

    return response.body;
  },
});
