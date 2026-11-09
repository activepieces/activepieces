import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiUpdateListAction = createAction({
  auth: apolloAuth,
  name: 'ai_update_list',
  classification: 'WRITE',
  displayName: 'Rename List',
  description: 'Rename a saved list.',
  audience: 'ai',
  aiMetadata: {
    description: 'Renames one saved Apollo list by list ID. Apollo refuses a name another list already uses. Uses no credits.',
    idempotent: true,
  },
  props: {
    list_id: aiProps.id({ displayName: 'List ID', description: 'List ID from List Lists (field id).' }),
    name: aiProps.text({ displayName: 'New Name', description: 'New list name.', required: true }),
  },
  outputSchema: apolloOutputSchemas.list,
  async run({ propsValue, auth }) {
    const body = await apolloRequests.updateList({
      apiKey: apiKeyOf(auth),
      listId: apolloInputs.requireText({ value: propsValue.list_id, label: 'List ID' }),
      name: apolloInputs.requireText({ value: propsValue.name, label: 'New Name' }),
    });
    return { list: apolloMappers.list(body['label']) };
  },
});
