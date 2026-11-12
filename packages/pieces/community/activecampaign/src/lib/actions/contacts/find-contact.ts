import { Property, createAction } from '@activepieces/pieces-framework';
import { activeCampaignAuth } from '../../auth';
import { makeClient } from '../../common';
import { findContactOutputSchema } from '../../common/output-schemas';
import { acData } from '../../common/types';

export const findContactAction = createAction({
	auth: activeCampaignAuth,
	name: 'activecampaign_find_contact',
	classification: 'READ',
	displayName: 'Find Contact',
	description: 'Finds a contact by email address.',
	audience: 'human',
	aiMetadata: {
		description: 'Looks up one contact by exact email address and reports whether it exists. Read-only and safe to repeat.',
		idempotent: true,
	},
	outputSchema: findContactOutputSchema,
	props: {
		email: Property.ShortText({ displayName: 'Email', required: true }),
	},
	async run({ auth, propsValue }) {
		const email = propsValue.email.trim();
		const body = await makeClient(auth.props).get({ path: '/contacts', query: { email } });
		const contact = acData
			.recordsAt({ value: body, key: 'contacts' })
			.find((record) => (acData.textAt({ value: record, key: 'email' }) ?? '').toLowerCase() === email.toLowerCase());
		return { found: contact !== undefined, contact: contact ?? null };
	},
});
