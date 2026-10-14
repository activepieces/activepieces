import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { resolveContact } from '../common/lookups';
import { contactOutputSchema } from '../output-schemas';

export const getContactAction = createAction({
	auth: intercomAuth,
	name: 'get_contact',
	classification: 'READ',
	displayName: 'Get Contact',
	description: 'Gets one contact (user or lead) by ID, email or external ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Gets one contact (user or lead) by Intercom ID, email or external ID. Fails when no contact matches, or when several contacts share the email (then use Search Contacts). Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		lookupBy: Property.StaticDropdown({
			displayName: 'Look Up By',
			required: true,
			defaultValue: 'id',
			options: {
				disabled: false,
				options: [
					{ label: 'Contact ID', value: 'id' },
					{ label: 'Email', value: 'email' },
					{ label: 'External ID', value: 'external_id' },
				],
			},
		}),
		value: Property.ShortText({
			displayName: 'Value',
			description: 'The contact ID, email or external ID.',
			required: true,
		}),
	},
	outputSchema: contactOutputSchema,
	async run(context) {
		const lookupBy = context.propsValue.lookupBy;
		return resolveContact({
			auth: context.auth,
			lookupBy: lookupBy === 'email' ? 'email' : lookupBy === 'external_id' ? 'external_id' : 'id',
			value: context.propsValue.value,
		});
	},
});
