import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListOrganizationsOutputSchema } from '../../../output-schemas';

export const zendeskListOrganizations = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_organizations',
  outputSchema: zendeskListOrganizationsOutputSchema,
  displayName: 'List Organizations',
  description: 'List organizations.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists organizations one page at a time. Use Search Organizations to find one by name or external ID.',
    idempotent: true,
  },
  props: {
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ organizations: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/organizations.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      organizations: response.organizations,
      count: response.organizations.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
