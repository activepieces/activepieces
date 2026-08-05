import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';

export const findOrCreateCompanyAction = createAction({
	auth: intercomAuth,
	name: 'find-or-create-company',
	displayName: 'Find or Create Company',
	description: 'Finds a company by Company ID or name, creating it if none is found.',
	audience: 'both',
	aiMetadata: {
		description:
			'Resolve a company to a single record: looks it up by Company ID (preferred) or name and returns the match, or creates a new company when none exists. Returns the company plus a "created" flag. Effectively idempotent when a Company ID is supplied.',
		idempotent: true,
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
	async run(context) {
		const { companyId, name, plan, size, website, industry, customAttributes } =
			context.propsValue;

		if (!companyId && !name) {
			throw new Error('Provide a Company ID or a Name to find or create a company.');
		}

		const client = intercomClient(context.auth);

		const existing = await client.companies.retrieve({
			company_id: companyId || undefined,
			name: companyId ? undefined : name || undefined,
			per_page: 1,
		});

		if (existing.data.length > 0) {
			return { created: false, company: existing.data[0] };
		}

		const company = await client.companies.createOrUpdate({
			company_id: companyId,
			name,
			plan,
			size,
			website,
			industry,
			custom_attributes: customAttributes,
		});

		return { created: true, company };
	},
});
