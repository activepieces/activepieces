import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskAddOrganizationTagsOutputSchema } from '../../../output-schemas';

export const zendeskGetOrganizationTags = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_organization_tags',
  outputSchema: zendeskAddOrganizationTagsOutputSchema,
  displayName: 'Get Organization Tags',
  description: 'List the tags on an organization.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the tags on one organization. Change them with Add Organization Tags or Remove Organization Tags.',
    idempotent: true,
  },
  props: {
    organization_id: zendeskAiProps.requiredId({ displayName: 'Organization ID', description: 'Numeric organization ID, from Search Organizations or List Organizations.' }),
  },
  async run({ auth, propsValue }) {
    const organizationId = zendeskApi.id({ value: propsValue.organization_id, label: 'Organization ID' });
    const response = await zendeskApi.request<{ tags: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/organizations/${organizationId}/tags.json`,
    });
    return { tags: response.tags, count: response.tags.length };
  },
});
