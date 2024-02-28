import { activeCampaignAuth } from '../../../';
import { Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';

export const subscribeOrUnsubscribeContactFromListAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_subscribe_or_unsubscribe_contact_from_list',
	displayName: 'Subscribe or Unsubscribe Contact From List',
	description:
		'Subscribes a Contact to a List it is not currently associated with, or Unsubscribes a Contact from a list is currently associated with.',
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

		const client = makeClient(context.auth);
		return await client.addContactToList(listId!, contactId, status);
	},
});
