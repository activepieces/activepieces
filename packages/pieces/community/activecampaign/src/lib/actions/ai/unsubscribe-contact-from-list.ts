import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { listMembershipOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const unsubscribeContactFromListAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_unsubscribe_contact_from_list',
	classification: 'DESTRUCTIVE',
	displayName: 'Unsubscribe Contact from List',
	description: 'Unsubscribes a contact from a list.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Unsubscribes a contact (by ID or email) from a mailing list; the contact stays in the account with status unsubscribed on that list. Use Delete Contact only to erase the contact. Safe to repeat.',
		idempotent: true,
	},
	outputSchema: listMembershipOutputSchema,
	props: {
		contact_id_or_email: aiProps.contactIdOrEmail(),
		list_id: Property.ShortText({ displayName: 'List ID', description: 'Use List Lists to find the ID.', required: true }),
	},
	async run({ auth, propsValue }) {
		const client = makeClient(auth.props);
		const listId = aiInput.numericId({ value: propsValue.list_id, label: 'List ID' });
		const contactId = await aiInput.resolveContactId({ client, value: propsValue.contact_id_or_email, label: 'Contact ID or Email' });
		const response = await client.addContactToList({ listId, contactId, status: '2' });
		return {
			contactId,
			listId,
			status: 'unsubscribed',
			contactList: aiOutput.idText({
				record: acData.recordAt({ value: response.body, key: 'contactList' }),
				keys: ['id', 'list', 'contact', 'status', 'sdate', 'udate', 'sourceid'],
			}),
		};
	},
});
