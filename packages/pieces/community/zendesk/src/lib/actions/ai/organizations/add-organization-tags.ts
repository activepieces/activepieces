import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskAddOrganizationTagsOutputSchema } from '../../../output-schemas';

export const zendeskAddOrganizationTags = createAction({
  auth: zendeskAuth,
  name: 'zendesk_add_organization_tags',
  outputSchema: zendeskAddOrganizationTagsOutputSchema,
  displayName: 'Add Organization Tags',
  description: 'Add tags to an organization, keeping existing tags.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds tags to one organization and keeps the tags already on it; re-adding an existing tag changes nothing. Returns the full tag list.',
    idempotent: true,
  },
  props: {
    organization_id: zendeskAiProps.requiredId({ displayName: 'Organization ID', description: 'Numeric organization ID, from Search Organizations or List Organizations.' }),
    tags: Property.Array({ displayName: 'Tags', description: 'Tags to add; tags are lowercase and cannot contain spaces.', required: true }),
  },
  async run({ auth, propsValue }) {
    const organizationId = zendeskApi.id({ value: propsValue.organization_id, label: 'Organization ID' });
    const tags = zendeskApi.stringList(propsValue.tags);
    if (tags.length === 0) {
      throw new Error('Tags must contain at least one tag.');
    }
    const response = await zendeskApi.request<{ tags: unknown[] }>({
      auth,
      method: HttpMethod.PUT,
      path: `/organizations/${organizationId}/tags.json`,
      body: { tags },
    });
    return { tags: response.tags, count: response.tags.length };
  },
});
