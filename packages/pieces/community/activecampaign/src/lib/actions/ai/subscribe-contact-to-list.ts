import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { listMembershipOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const subscribeContactToListAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_subscribe_contact_to_list',
	classification: 'WRITE',
	displayName: 'Subscribe Contact to List',
	description: 'Subscribes a contact to a list.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Subscribes a contact (by ID or email) to a mailing list. A contact who unsubscribed can only be re-subscribed when the account has the resubscribe permission; otherwise ActiveCampaign rejects it. Safe to repeat.',
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
		const response = await client.addContactToList({ listId, contactId, status: '1' });
		return {
			contactId,
			listId,
			status: 'subscribed',
			contactList: aiOutput.idText({
				record: acData.recordAt({ value: response.body, key: 'contactList' }),
				keys: ['id', 'list', 'contact', 'status', 'sdate', 'udate', 'sourceid'],
			}),
		};
	},
});
