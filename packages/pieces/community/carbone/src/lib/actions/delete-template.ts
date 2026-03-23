import { createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { CARBONE_API_URL, CARBONE_VERSION } from '../common/constants';
import { carboneAuth } from '../auth';
import { carboneProps } from '../common/props';

export const deleteTemplateAction = createAction({
  auth: carboneAuth,
  name: 'carbone_delete_template',
  displayName: 'Delete Template',
  description: 'Delete a Carbone template by its ID.',
  props: {
    templateId: carboneProps.templateDropdown({
      displayName: 'Template ID or Version ID',
      description: 'Select a template to delete.',
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
