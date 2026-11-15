import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskAddOrganizationTagsOutputSchema } from '../../../output-schemas';

export const zendeskRemoveOrganizationTags = createAction({
  auth: zendeskAuth,
  name: 'zendesk_remove_organization_tags',
  outputSchema: zendeskAddOrganizationTagsOutputSchema,
  displayName: 'Remove Organization Tags',
  description: 'Remove tags from an organization.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes the given tags from one organization and keeps the rest; tags not on it are ignored. Returns the remaining tag list.',
    idempotent: true,
  },
  props: {
    organization_id: zendeskAiProps.requiredId({ displayName: 'Organization ID', description: 'Numeric organization ID, from Search Organizations or List Organizations.' }),
    tags: Property.Array({ displayName: 'Tags', description: 'Tags to remove; tags are lowercase and cannot contain spaces.', required: true }),
  },
  async run({ auth, propsValue }) {
    const organizationId = zendeskApi.id({ value: propsValue.organization_id, label: 'Organization ID' });
    const tags = zendeskApi.stringList(propsValue.tags);
    if (tags.length === 0) {
      throw new Error('Tags must contain at least one tag.');
    }
    const response = await zendeskApi.request<{ tags: unknown[] }>({
      auth,
      method: HttpMethod.DELETE,
      path: `/organizations/${organizationId}/tags.json`,
      queryParams: {
        tags: tags.join(','),
      },
    });
    return { tags: response.tags, count: response.tags.length };
  },
});
