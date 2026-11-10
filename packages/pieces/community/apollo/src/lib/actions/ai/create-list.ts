import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiCreateListAction = createAction({
  auth: apolloAuth,
  name: 'ai_create_list',
  classification: 'WRITE',
  displayName: 'Create List',
  description: 'Create an empty contact or account list.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates an empty saved list for contacts or accounts in Apollo and returns its ID. Check List Lists first; then fill it with Add Records to List. Uses no credits.',
    idempotent: false,
  },
  props: {
    name: aiProps.text({ displayName: 'List Name', description: 'Name of the new list.', required: true }),
    modality: aiProps.choice({
      displayName: 'Holds',
      description: 'What the list holds.',
      required: true,
      options: [
        { label: 'Contacts', value: 'contacts' },
        { label: 'Accounts', value: 'accounts' },
      ],
    }),
  },
  outputSchema: apolloOutputSchemas.list,
  async run({ propsValue, auth }) {
    const body = await apolloRequests.createList({
      apiKey: apiKeyOf(auth),
      name: apolloInputs.requireText({ value: propsValue.name, label: 'List Name' }),
      modality: apolloInputs.requireText({ value: propsValue.modality, label: 'Holds' }),
    });
    return { list: apolloMappers.list(body['label']) };
  },
});
