import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const enrichPerson = createAction({
	auth: pubrioAuth,
	name: 'enrich_person',
	displayName: 'Enrich Person',
	description: 'Get enriched person data with full professional details (uses credits)',
	props: {
		lookup_type: Property.StaticDropdown({
			displayName: 'Lookup Type',
			required: true,
			options: {
				options: [
					{ label: 'LinkedIn URL', value: 'linkedin_url' },
					{ label: 'People Search ID', value: 'people_search_id' },
				],
			},
		}),
		value: Property.ShortText({ displayName: 'Value', required: true }),
	},
	async run(context) {
		const body: Record<string, unknown> = {
			[context.propsValue.lookup_type]: context.propsValue.value,
		};
		return await pubrioRequest(context.auth, HttpMethod.POST, '/people/enrichment', body);
	},
});
