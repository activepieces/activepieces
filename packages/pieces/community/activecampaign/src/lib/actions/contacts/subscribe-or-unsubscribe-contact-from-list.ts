import { activeCampaignAuth } from '../../auth';
import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { activecampaignCommon, makeClient } from '../../common';
import { subscribeOrUnsubscribeOutputSchema } from '../../common/output-schemas';

export const subscribeOrUnsubscribeContactFromListAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_subscribe_or_unsubscribe_contact_from_list',
	classification: 'WRITE',
	displayName: 'Subscribe or Unsubscribe Contact from List',
	description: 'Subscribes a contact to a list, or unsubscribes them.',
	audience: 'human',
	aiMetadata: { description: 'Sets a contact\'s subscription status on a mailing list, toggling between Subscribe and Unsubscribe via the Action field. Use to add a contact to a list or remove them from one for email marketing. Requires a list ID and the contact ID; idempotent because re-applying the same status leaves the membership unchanged.', idempotent: true },
	outputSchema: subscribeOrUnsubscribeOutputSchema,
	props: {
		listId: activecampaignCommon.listId(true),
		status: Property.StaticDropdown({
			displayName: 'Action',
			required: true,
			display: 'cards',
			options: {
				disabled: false,
				options: [
					{
						label: 'Subscribe',
						value: '1',
						description: 'Gets campaigns',
					},
					{
						label: 'Unsubscribe',
						value: '2',
						description: 'Stops getting campaigns',
					},
				],
			},
		}),
		resubscribeNote: Property.MarkDown({
			value: 'Re-subscribing someone who unsubscribed needs the resubscribe permission on your account.',
			variant: MarkdownVariant.INFO,
		}),
		contactId: Property.ShortText({
			displayName: 'Contact ID',
			description: "Map the contact's ID from a trigger or Find Contact.",
			required: true,
			placeholder: '42',
		}),
	},
	async run(context) {
		const { listId, status, contactId } = context.propsValue;

		const client = makeClient(context.auth.props);
		return (await client.addContactToList({ listId, contactId, status })).body;
	},
});
