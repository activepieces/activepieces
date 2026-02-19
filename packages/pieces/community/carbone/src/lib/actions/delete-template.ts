import { carboneAuth } from '../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

const CARBONE_API_URL = 'https://api.carbone.io';
const CARBONE_VERSION = '4';

export const deleteTemplateAction = createAction({
  auth: carboneAuth,
  name: 'carbone_delete_template',
  displayName: 'Delete Template',
  description: 'Delete a previously uploaded Carbone template by its ID.',
  props: {
    templateId: Property.ShortText({
      displayName: 'Template ID',
      required: true,
      description: 'The ID of the template to delete.',
    }),
  },
  async run(context) {
    const { templateId } = context.propsValue;

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `${CARBONE_API_URL}/template/${templateId}`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
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
