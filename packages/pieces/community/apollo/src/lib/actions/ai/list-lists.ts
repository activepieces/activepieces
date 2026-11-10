import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiListListsAction = createAction({
  auth: apolloAuth,
  name: 'ai_list_lists',
  classification: 'SEARCH',
  displayName: 'List Lists',
  description: 'List the contact and account lists in your Apollo workspace.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists every saved list in your Apollo workspace with its ID, name, what it holds (contacts or accounts) and record count, optionally only one kind. Use the IDs or exact names with Add Records to List, Remove Records from List, Search Contacts and Search Accounts. Uses no credits.',
    idempotent: true,
  },
  props: {
    modality: aiProps.choice({
      displayName: 'Holds',
      description: 'Only lists of this kind (default: all).',
      required: false,
      options: [
        { label: 'Contacts', value: 'contacts' },
        { label: 'Accounts', value: 'accounts' },
      ],
    }),
  },
  outputSchema: apolloOutputSchemas.lists,
  async run({ propsValue, auth }) {
    const modality = apolloInputs.optionalText(propsValue.modality);
    const lists = await apolloRequests.listLists({ apiKey: apiKeyOf(auth) });
    return { lists: lists.filter((list) => modality === undefined || list['modality'] === modality).map((list) => apolloMappers.list(list)) };
  },
});
