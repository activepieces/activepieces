import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { carboneClient } from '../common/client';
import { carboneAuth } from '../auth';
import { carboneProps } from '../common/props';

export const deleteTemplateAction = createAction({
  auth: carboneAuth,
  name: 'carbone_delete_template',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Template',
  description: 'Delete a Carbone template by its ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently deletes a stored Carbone template (or specific version) identified by its template/version ID. Use to remove a template that is no longer needed. Not idempotent: the first call removes the template and a repeat call on the same ID fails because it no longer exists.',
    idempotent: false,
  },
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'templateId', label: 'Template ID' },
      { key: 'message', label: 'Message' },
    ],
  },
  props: {
    templateId: carboneProps.templateDropdown({
      displayName: 'Template ID or Version ID',
      description: 'Select a template to delete.',
    }),
  },
  async run(context) {
    const templateId = carboneClient.readId({ value: context.propsValue.templateId, label: 'Template ID' });
    await carboneClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/template/${encodeURIComponent(templateId)}`,
      operation: 'delete template',
    });
    return {
      success: true,
      templateId,
      message: `Template ${templateId} deleted successfully.`,
    };
  },
});
