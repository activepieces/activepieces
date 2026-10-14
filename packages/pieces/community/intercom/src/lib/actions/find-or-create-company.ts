import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { intercomRequest } from '../common';
import { findCompanyBy } from '../common/lookups';
import { findOrCreateCompanyOutputSchema } from '../output-schemas';

export const findOrCreateCompanyAction = createAction({
	auth: intercomAuth,
	name: 'find-or-create-company',
	classification: 'WRITE',
	displayName: 'Find or Create Company',
	description: 'Finds a company by Company ID or name, creating it if none is found.',
	audience: 'both',
	aiMetadata: {
		description:
			'Resolve a company to a single record: looks it up by your Company ID (preferred) or exact name and returns the match, or creates a new company when none exists. Returns the company plus a "created" flag. With a Company ID a retry finds the same company; with only a name, a company that has no contact yet is not found by name, so a duplicate can be created.',
		idempotent: false,
	},
	props: {
		companyId: Property.ShortText({
			displayName: 'Company ID',
			description: 'The company ID you have defined for the company. Used to look up and create.',
			required: false,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Used to look up by name when no Company ID is given, and when creating.',
			required: false,
		}),
		plan: Property.ShortText({
			displayName: 'Plan',
			required: false,
		}),
		size: Property.Number({
			displayName: 'Size',
			required: false,
		}),
		website: Property.ShortText({
			displayName: 'Website',
			required: false,
		}),
		industry: Property.ShortText({
			displayName: 'Industry',
			required: false,
		}),
		customAttributes: Property.Object({
			displayName: 'Custom Attributes',
			required: false,
		}),
	},
	outputSchema: findOrCreateCompanyOutputSchema,
	async run(context) {
		const { companyId, name, plan, size, website, industry, customAttributes } =
			context.propsValue;

		if (!companyId && !name) {
			throw new Error('Provide a Company ID or a Name to find or create a company.');
		}

		const existing = companyId
			? await findCompanyBy({ auth: context.auth, field: 'company_id', value: companyId })
			: await findCompanyBy({ auth: context.auth, field: 'name', value: name ?? '' });

		if (existing !== undefined) {
			return { created: false, company: existing };
		}

		const company = await intercomRequest<Record<string, unknown>>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: ['companies'],
			body: {
				company_id: companyId || undefined,
				name: name || undefined,
				plan,
				size,
				website,
				industry,
				custom_attributes: customAttributes,
			},
			operation: 'create the company',
		});

		return { created: true, company };
	},
});
