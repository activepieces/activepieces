import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { aiInput, aiOutput, aiProps } from '../../common/ai-props';
import { listContactsOutputSchema } from '../../common/output-schemas';

export const listContactsAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_list_contacts',
	classification: 'SEARCH',
	displayName: 'List Contacts',
	description: 'Lists or searches contacts.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Searches ActiveCampaign contacts by free text, exact email, tag, list, status or last update, oldest first, one page at a time. Use it to find a contact ID for the other contact actions; use Get Contact for one contact\'s tags, lists and custom field values. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: listContactsOutputSchema,
	props: {
		search: Property.ShortText({ displayName: 'Search', description: 'Matches name, email, phone or organization.', required: false }),
		email: Property.ShortText({ displayName: 'Email', description: 'Exact email address.', required: false }),
		tag_id: Property.ShortText({ displayName: 'Tag ID', description: 'Only contacts with this tag. Use List Tags to find the ID.', required: false }),
		list_id: Property.ShortText({ displayName: 'List ID', description: 'Only contacts on this list. Use List Lists to find the ID.', required: false }),
		status: Property.StaticDropdown<string>({
			displayName: 'List Status',
			description: 'Only contacts with this status on the list. Needs List ID.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Any', value: '-1' },
					{ label: 'Unconfirmed', value: '0' },
					{ label: 'Active', value: '1' },
					{ label: 'Unsubscribed', value: '2' },
					{ label: 'Bounced', value: '3' },
				],
			},
		}),
		updated_after: Property.ShortText({
			displayName: 'Updated After',
			description: 'ISO 8601 date or date-time, such as 2026-03-01 or 2026-03-01T09:00:00Z.',
			required: false,
		}),
		limit: aiProps.limit,
		offset: aiProps.offset,
	},
	async run({ auth, propsValue }) {
		const { limit, offset } = aiInput.pageParams({ limit: propsValue.limit, offset: propsValue.offset });
		const listId = aiInput.optionalNumericId({ value: propsValue.list_id, label: 'List ID' });
		const status = aiInput.optionalText(propsValue.status);
		if (status !== undefined && listId === undefined) {
			throw new Error('List Status needs a List ID.');
		}
		const page = await makeClient(auth.props).listPage({
			path: '/contacts',
			key: 'contacts',
			limit,
			offset,
			query: {
				search: aiInput.optionalText(propsValue.search),
				email: aiInput.optionalText(propsValue.email),
				tagid: aiInput.optionalNumericId({ value: propsValue.tag_id, label: 'Tag ID' }),
				listid: listId,
				status,
				'filters[updated_after]': aiInput.isoDateTime({ value: propsValue.updated_after, label: 'Updated After' }),
				'orders[cdate]': 'ASC',
			},
		});
		return { ...page, items: page.items.map(aiOutput.contactSummary) };
	},
});
