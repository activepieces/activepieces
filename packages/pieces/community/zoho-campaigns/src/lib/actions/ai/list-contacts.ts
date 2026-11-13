import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsListContactsOutputSchema } from '../../output-schemas';

import type { ZohoCampaignsContactStatus } from '../../common/types';

const NO_CONTACTS_CODE = '2502';

export const listContactsAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_list_contacts',
	outputSchema: zohoCampaignsListContactsOutputSchema,
	displayName: 'List Contacts',
	description: 'Lists the contacts of a mailing list, optionally filtered by status or email.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists contacts of a mailing list (key from List Mailing Lists) with email, name, phone and company, filtered by status and paged with From Index and Range. Email Contains keeps only contacts whose email contains the text (case-insensitive) within the returned page. Returns an empty list when the list has no contacts with that status.',
		idempotent: true,
	},
	props: {
		listKey: zohoCampaignsAiProps.listKey({ required: true }),
		status: Property.StaticDropdown<ZohoCampaignsContactStatus, false>({
			displayName: 'Status',
			description: 'Only return contacts in this status. Defaults to active.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Active', value: 'active' },
					{ label: 'Recent', value: 'recent' },
					{ label: 'Most Recent', value: 'most recent' },
					{ label: 'Unsubscribed', value: 'unsub' },
					{ label: 'Bounced', value: 'bounce' },
				],
			},
		}),
		emailContains: Property.ShortText({
			displayName: 'Email Contains',
			description: 'Only keep contacts whose email contains this text (case-insensitive).',
			required: false,
		}),
		sort: zohoCampaignsAiProps.sort({ required: false }),
		fromIndex: zohoCampaignsAiProps.fromIndex({ required: false }),
		range: zohoCampaignsAiProps.range({ required: false }),
	},
	async run({ auth, propsValue }) {
		const response = await zohoCampaignsApi.getListSubscribers({
			auth,
			listkey: propsValue.listKey,
			status: propsValue.status,
			sort: propsValue.sort,
			fromindex: propsValue.fromIndex,
			range: propsValue.range,
		});
		if (String(response.code) === NO_CONTACTS_CODE) {
			return { list_of_details: [], count: 0 };
		}
		const body = zohoCampaignsUtils.assertSuccess({ body: response });
		const needle = propsValue.emailContains?.toLowerCase();
		const contacts = body.list_of_details ?? [];
		const matches = needle
			? contacts.filter((contact) => (contact.contact_email ?? '').toLowerCase().includes(needle))
			: contacts;
		return { ...body, list_of_details: matches, count: matches.length };
	},
});
