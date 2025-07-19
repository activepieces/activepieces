import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { placidApiCall } from './client';

interface PlacidTemplate {
  uuid: string;
  title: string;
  thumbnail: string;
  width: number;
  height: number;
  tags: string[];
  custom_data: any;
  collections: any[];
  layers: {
    name: string;
    type: string;
  }[];
}

export const templateUuid = Property.Dropdown({
  displayName: 'Template',
  description: 'Select a template from your Placid project.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your Placid account.',
      };
    }

    let response: { data: PlacidTemplate[] };

    try {
      response = await placidApiCall<{ data: PlacidTemplate[] }>({
        apiKey: auth as string,
        method: HttpMethod.GET,
        resourceUri: '/templates',
      });
    } catch (e: any) {
      return {
        disabled: true,
        options: [],
        placeholder: `Error fetching templates: ${e.message}`,
      };
    }

    const templates = Array.isArray(response.data) ? response.data : [];

    if (templates.length === 0) {
      return {
        disabled: true,
        options: [],
        placeholder: 'No templates found in your Placid account.',
      };
    }

    return {
      disabled: false,
      options: templates.map((template) => ({
        label: `${template.title} (${template.uuid})`,
        value: template.uuid,
      })),
    };
  },
});
