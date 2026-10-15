import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { emeliaAuth } from '../auth';
import { EmeliaListContact, emeliaApi } from '../common/api';
import { emeliaClient } from '../common/client';
import { emeliaProps } from '../common/props';

export const findContactInListAction = createAction({
	auth: emeliaAuth,
	name: 'find_contact_in_list',
	classification: 'SEARCH',
	displayName: 'Find Contact in List',
	description: 'Looks up a contact in a contact list by email or LinkedIn profile URL.',
	audience: 'both',
	aiMetadata: {
		description:
			'Look up contacts in one Emelia contact list (and the lists linked to it) by exact email (case-insensitive) or exact LinkedIn profile URL; returns up to 50 matches, empty when none. Use it before updating or to check whether someone is already in a list. Read-only, safe to retry.',
		idempotent: true,
	},
	props: {
		list: emeliaProps.listDropdown({ description: 'The list to search in.' }),
		searchBy: Property.StaticDropdown<'email' | 'linkedinUrl', true>({
			displayName: 'Search By',
			required: true,
			defaultValue: 'email',
			options: {
				disabled: false,
				options: [
					{ label: 'Email', value: 'email' },
					{ label: 'LinkedIn Profile URL', value: 'linkedinUrl' },
				],
			},
		}),
		value: Property.ShortText({
			displayName: 'Email or LinkedIn URL',
			description: 'The exact value to look for. LinkedIn URLs must match exactly as stored (a trailing slash or missing `www` makes a difference).',
			required: true,
			placeholder: 'jane.doe@acme.com',
		}),
	},
	async run(context) {
		const { list, searchBy, value } = context.propsValue;
		const response = await emeliaClient.request<{ items?: EmeliaListContact[] }>({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			path: `/lists/list/${encodeURIComponent(list)}/rows`,
			queryParams: { [searchBy]: value.trim() },
		});
		return (response.items ?? []).map((contact) => emeliaApi.flattenListContact({ contact }));
	},
});
