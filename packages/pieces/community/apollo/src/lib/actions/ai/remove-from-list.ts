import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiRemoveFromListAction = createAction({
  auth: apolloAuth,
  name: 'ai_remove_from_list',
  classification: 'WRITE',
  displayName: 'Remove Records from List',
  description: 'Remove contacts or accounts from a list.',
  audience: 'ai',
  aiMetadata: {
    description: 'Removes contacts or accounts from a saved list, given by list ID or exact name, and returns the list with its record count afterwards. The records themselves are not deleted. Unknown record IDs are ignored. Uses no credits.',
    idempotent: true,
  },
  props: {
    list: aiProps.text({ displayName: 'List', description: 'List ID or exact list name from List Lists.', required: true }),
    modality: aiProps.choice({
      displayName: 'Record Type',
      description: 'contacts for contact IDs, accounts for account IDs.',
      required: true,
      options: [
        { label: 'Contacts', value: 'contacts' },
        { label: 'Accounts', value: 'accounts' },
      ],
    }),
    record_ids: aiProps.textList({ displayName: 'Record IDs', description: 'Contact IDs or account IDs (field id from Search Contacts or Search Accounts), up to 100.', required: true }),
  },
  outputSchema: apolloOutputSchemas.listMembership,
  async run({ propsValue, auth }) {
    const apiKey = apiKeyOf(auth);
    const modality = apolloInputs.requireText({ value: propsValue.modality, label: 'Record Type' });
    if (modality !== 'contacts' && modality !== 'accounts') {
      throw new Error('Record Type must be contacts or accounts.');
    }
    const recordIds = apolloInputs.requireStringList({ value: propsValue.record_ids, label: 'Record IDs', max: 100 });
    const target = await apolloRequests.resolveList({ apiKey, reference: apolloInputs.requireText({ value: propsValue.list, label: 'List' }), modality });
    await apolloRequests.changeListMembers({ apiKey, listName: String(target['name']), entityIds: recordIds, modality, action: 'remove' });
    const after = (await apolloRequests.listLists({ apiKey })).find((item) => String(item['id']) === String(target['id'])) ?? target;
    return {
      list: apolloMappers.list(after),
      modality,
      requested_ids: recordIds,
    };
  },
});
