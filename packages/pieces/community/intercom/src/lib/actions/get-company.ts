import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../auth';
import { intercomRequest } from '../common';
import { findCompanyBy, requireText } from '../common/lookups';
import { companyOutputSchema } from '../output-schemas';

export const getCompanyAction = createAction({
	auth: intercomAuth,
	name: 'get_company',
	classification: 'READ',
	displayName: 'Get Company',
	description: 'Gets one company by its Intercom ID or by your own Company ID.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Gets one company by its Intercom ID or by your own Company ID, and fails with a clear error when none matches. Use Find Company to look up by name without failing. Read-only and safe to retry.',
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
					{ label: 'Intercom Company ID', value: 'id' },
					{ label: 'Your Company ID', value: 'company_id' },
				],
			},
		}),
		value: Property.ShortText({ displayName: 'Value', required: true }),
	},
	outputSchema: companyOutputSchema,
	async run(context) {
		const value = requireText({ label: 'Value', value: context.propsValue.value });
		if (context.propsValue.lookupBy === 'company_id') {
			const company = await findCompanyBy({ auth: context.auth, field: 'company_id', value });
			if (company === undefined) {
				throw new Error(`No Intercom company has the Company ID ${value}.`);
			}
			return company;
		}
		return intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: ['companies', value],
			operation: 'get the company',
		});
	},
});
