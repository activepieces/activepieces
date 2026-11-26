import { carboneAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { carboneClient, carboneOutputFields } from '../common/client';
import { carboneProps } from '../common/props';

export const downloadTemplateAction = createAction({
  auth: carboneAuth,
  name: 'carbone_download_template',
  classification: 'READ',
  displayName: 'Download Template',
  description: 'Download the original file of a stored Carbone template.',
  audience: 'both',
  aiMetadata: {
    description: 'Downloads the original template file stored in Carbone for a template ID or version ID and returns it as a file. Use to back up or inspect a template. Read-only on Carbone; each call stores a new copy of the file in the flow run.',
    idempotent: true,
  },
  outputSchema: {
    fields: [{ key: 'templateId', label: 'Template ID' }, ...carboneOutputFields.file],
  },
  props: {
    templateId: carboneProps.templateDropdown({
      displayName: 'Template ID or Version ID',
      description: 'Select a template, or map a template ID or version ID.',
    }),
  },
  async run(context) {
    const templateId = carboneClient.readId({ value: context.propsValue.templateId, label: 'Template ID' });
    const response = await carboneClient.request<Buffer>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/template/${encodeURIComponent(templateId)}`,
      operation: 'download template',
      responseType: 'arraybuffer',
      timeoutMs: carboneClient.RENDER_TIMEOUT_MS,
    });
    const file = await carboneClient.saveFileResponse({
      response,
      fallbackName: `template-${templateId}`,
      writeFile: (params) => context.files.write(params),
    });
    return { templateId, ...file };
  },
});
