import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const enrichCompany = createAction({
	auth: pubrioAuth,
	name: 'enrich_company',
	displayName: 'Enrich Company',
	description: 'Get enriched company data with full firmographic details (uses credits)',
	props: {
		lookup_type: Property.StaticDropdown({
			displayName: 'Lookup Type',
			required: true,
			options: {
				options: [
					{ label: 'Domain', value: 'domain' },
					{ label: 'LinkedIn URL', value: 'linkedin_url' },
					{ label: 'Domain Search ID', value: 'domain_search_id' },
					{ label: 'Domain ID', value: 'domain_id' },
				],
			},
		}),
		value: Property.ShortText({ displayName: 'Value', required: true, description: 'Domain, LinkedIn URL, Domain Search ID, or Domain ID (integer)' }),
	},
	async run(context) {
		const lookupType = context.propsValue.lookup_type;
		const rawValue = context.propsValue.value;
		const body: Record<string, unknown> = {
			[lookupType]: lookupType === 'domain_id' ? parseInt(rawValue, 10) : rawValue,
		};
		return await pubrioRequest(context.auth as string, HttpMethod.POST, '/companies/lookup/enrich', body);
	},
});
