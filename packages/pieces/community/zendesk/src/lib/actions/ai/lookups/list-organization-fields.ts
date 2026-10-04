import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListOrganizationFieldsOutputSchema } from '../../../output-schemas';

export const zendeskListOrganizationFields = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_organization_fields',
  outputSchema: zendeskListOrganizationFieldsOutputSchema,
  displayName: 'List Organization Fields',
  description: 'List the custom organization fields.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists custom organization fields with their keys, types and options, for organization_fields on Create Organization and Update Organization.',
    idempotent: true,
  },
  props: {
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ organization_fields: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/organization_fields.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      organization_fields: response.organization_fields,
      count: response.organization_fields.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
