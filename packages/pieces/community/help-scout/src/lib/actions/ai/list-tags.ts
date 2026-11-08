import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const listTags = createAction({
  auth: helpScoutAuth,
  name: 'list_tags',
  classification: 'READ',
  displayName: 'List Tags',
  description: 'Lists the tags defined in the account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the tags defined in the Help Scout account with name, color and usage count. Use to pick existing tag names before Update Conversation Tags or Search Conversations. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['listTags'],
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of items to return (default 50, max 500). Help Scout pages are fetched until this is reached.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const { items, truncated } = await helpScoutApi.fetchPaged({
      auth,
      path: '/tags',
      embedKey: 'tags',
      limit: propsValue.limit ?? 50,
    });
    return { tags: items, count: items.length, truncated };
  },
});
