import { carboneAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  CarboneListResponse,
  CarboneTemplate,
  carboneClient,
  carboneOutputFields,
} from '../common/client';
import { carboneProps } from '../common/props';

export const getTemplateAction = createAction({
  auth: carboneAuth,
  name: 'carbone_get_template',
  classification: 'READ',
  displayName: 'Get Template',
  description: 'Get the details of one Carbone template by its ID.',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the metadata (name, category, tags, comment, version ID, type, size, timestamps) of the deployed version of one Carbone template identified by its template ID (or a version ID or legacy template ID). Fails if no template has that ID. Use List Template Versions for every version. Idempotent: read-only lookup.',
    idempotent: true,
  },
  outputSchema: { fields: carboneOutputFields.template },
  props: {
    templateId: carboneProps.templateDropdown({
      displayName: 'Template ID',
      description: 'Select a template, or map a template ID.',
    }),
  },
  async run(context) {
    const templateId = carboneClient.readId({ value: context.propsValue.templateId, label: 'Template ID' });
    const response = await carboneClient.request<CarboneListResponse<CarboneTemplate>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/templates',
      operation: 'get template',
      queryParams: { [/^\d+$/.test(templateId) ? 'id' : 'versionId']: templateId, limit: '1' },
    });
    const template = (response.body.data ?? [])[0];
    if (!template) {
      throw new Error(`Carbone get template failed: no template found with ID ${templateId}.`);
    }
    return template;
  },
});
