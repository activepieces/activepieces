import { carboneAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

const CARBONE_API_URL = 'https://api.carbone.io';
const CARBONE_VERSION = '5';

export const deleteTemplateAction = createAction({
  auth: carboneAuth,
  name: 'carbone_delete_template',
  displayName: 'Delete Template',
  description: 'Delete a previously uploaded Carbone template by its ID.',
  props: {
    templateId: Property.Dropdown({
      auth: carboneAuth,
      displayName: 'Template ID or Version ID',
      required: true,
      description:
        'Select a template to delete. Can use Template ID (deletes all versions) or Version ID (deletes specific version).',
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
          const response = await httpClient.sendRequest<{
            success: boolean;
            data: Array<{
              id: string;
              versionId: string;
              name: string;
              category: string;
            }>;
          }>({
            method: HttpMethod.GET,
            url: `${CARBONE_API_URL}/templates`,
            headers: {
              Authorization: `Bearer ${auth}`,
              'carbone-version': CARBONE_VERSION,
            },
            queryParams: { limit: '100' },
          });
          if (!response.body.success) {
            return {
              disabled: false,
              placeholder: 'Failed to fetch templates',
              options: [],
            };
          }
          return {
            disabled: false,
            options: response.body.data.map((template) => ({
              label: `${template.name || template.id} (${template.id})`,
              value: template.id,
            })),
          };
        } catch (e) {
          return {
            disabled: false,
            placeholder: 'Error loading templates',
            options: [],
          };
        }
      },
    }),
  },
  async run(context) {
    const { templateId } = context.propsValue;

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${CARBONE_API_URL}/template/${templateId}`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'carbone-version': CARBONE_VERSION,
      },
    };

    const response = await httpClient.sendRequest<{
      success: boolean;
      error?: string;
    }>(request);

    if (!response.body.success) {
      throw new Error(
        `Failed to delete template: ${response.body.error ?? 'Unknown error'}`
      );
    }

    return {
      success: true,
      templateId,
      message: `Template ${templateId} deleted successfully.`,
    };
  },
});
