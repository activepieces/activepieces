import { createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { activeCampaignApi } from '../../common/client';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { CONTACT_LIST_STATUS_LABELS } from '../../common/constants';
import { getContactOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const getContactAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_get_contact',
	classification: 'READ',
	displayName: 'Get Contact',
	description: 'Gets a contact with its tags, lists and custom field values.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Reads one contact by ID or email, with its custom field values, tag associations and list memberships. Use it after List Contacts when you need a contact\'s details. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: getContactOutputSchema,
	props: {
		contact_id_or_email: aiProps.contactIdOrEmail(),
	},
	async run({ auth, propsValue }) {
		const client = makeClient(auth.props);
		const contactId = await aiInput.resolveContactId({ client, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' });
		const base = `/contacts/${activeCampaignApi.segment(contactId)}`;
		const body = await client.get({ path: base });
		const fieldValues = await client.listAll({ path: `${base}/fieldValues`, key: 'fieldValues' });
		const tags = await client.listAll({ path: `${base}/contactTags`, key: 'contactTags' });
		const lists = await client.listAll({ path: `${base}/contactLists`, key: 'contactLists' });
		return {
			contact: aiOutput.contactSummary(acData.recordAt({ value: body, key: 'contact' })),
			fieldValues: fieldValues.items.map((record) => aiOutput.idText({ record, keys: ['id', 'field', 'value'] })),
			tags: tags.items.map((record) => aiOutput.idText({ record, keys: ['id', 'tag'] })),
			lists: lists.items.map((record) => {
				const status = acData.textAt({ value: record, key: 'status' }) ?? '';
				return { list: acData.textAt({ value: record, key: 'list' }), status: CONTACT_LIST_STATUS_LABELS[status] ?? status };
			}),
		};
	},
});
