import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';
import dayjs from 'dayjs';
import { companyOutputSchema } from '../output-schemas';

export const createOrUpdateCompanyAction = createAction({
	auth: intercomAuth,
	name: 'create-or-update-company',
	classification: 'WRITE',
	displayName: 'Create or Update Company',
	description: 'Creates a new company or updates an existing one (matched by Company ID).',
	audience: 'both',
	aiMetadata: {
		description:
			'Create or update a company. With a Company ID, Intercom updates the company that has it or creates one with it, so a retry converges; without a Company ID every call creates a new company. Company ID cannot be changed after creation.',
		idempotent: false,
	},
	props: {
		companyId: Property.ShortText({
			displayName: 'Company ID',
			description: 'The company ID you have defined for the company. Cannot be updated later.',
			required: false,
		}),
		name: Property.ShortText({
			displayName: 'Name',
			required: false,
		}),
		plan: Property.ShortText({
			displayName: 'Plan',
			required: false,
		}),
		size: Property.Number({
			displayName: 'Size',
			description: 'The number of employees in this company.',
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
		monthlySpend: Property.Number({
			displayName: 'Monthly Spend',
			description: 'How much revenue the company generates for your business (whole integers only).',
			required: false,
		}),
		remoteCreatedAt: Property.DateTime({
			displayName: 'Created At',
			description: 'The time the company was created by you.',
			required: false,
		}),
		customAttributes: Property.Object({
			displayName: 'Custom Attributes',
			required: false,
		}),
	},
	outputSchema: companyOutputSchema,
	async run(context) {
		const {
			companyId,
			name,
			plan,
			size,
			website,
			industry,
			monthlySpend,
			remoteCreatedAt,
			customAttributes,
		} = context.propsValue;

		if (!companyId && !name) {
			throw new Error('Provide a Company ID or a Name to create or update a company.');
		}

		const client = await intercomClient(context.auth);

		const response = await client.companies.createOrUpdate({
			company_id: companyId,
			name,
			plan,
			size,
			website,
			industry,
			monthly_spend: monthlySpend,
			remote_created_at: remoteCreatedAt ? dayjs(remoteCreatedAt).unix() : undefined,
			custom_attributes: customAttributes,
		});

		return response;
	},
});
