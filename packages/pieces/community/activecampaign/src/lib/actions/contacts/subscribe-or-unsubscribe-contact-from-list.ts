import { activeCampaignAuth } from '../../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';

export const subscribeOrUnsubscribeContactFromListAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_subscribe_or_unsubscribe_contact_from_list',
	displayName: 'Subscribe or Unsubscribe Contact From List',
	description:
		'Subscribes a Contact to a List it is not currently associated with, or Unsubscribes a Contact from a list is currently associated with.',
	audience: 'both',
	aiMetadata: { description: 'Sets a contact\'s subscription status on a mailing list, toggling between Subscribe and Unsubscribe via the Action field. Use to add a contact to a list or remove them from one for email marketing. Requires a list ID and the contact ID; idempotent because re-applying the same status leaves the membership unchanged.', idempotent: true },
	props: {
		listId: activecampaignCommon.listId(true),
		status: Property.StaticDropdown({
			displayName: 'Action',
			required: true,
			options: {
				disabled: false,
				options: [
					{
						label: 'Subscribe',
						value: '1',
					},
					{
						label: 'Unsubscribe',
						value: '2',
					},
				],
			},
		}),
		contactId: Property.ShortText({
			displayName: 'Contact ID',
			required: true,
		}),
	},
	async run(context) {
		const { listId, status, contactId } = context.propsValue;

		const client = makeClient(context.auth.props);
		return await client.addContactToList(listId!, contactId, status);
	},
});
