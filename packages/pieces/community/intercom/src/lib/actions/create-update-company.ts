import { intercomAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';
import dayjs from 'dayjs';

export const createOrUpdateCompanyAction = createAction({
	auth: intercomAuth,
	name: 'create-or-update-company',
	displayName: 'Create or Update Company',
	description: 'Creates a new company or updates an existing one (matched by Company ID).',
	audience: 'both',
	aiMetadata: {
		description:
			'Upsert a company: Intercom matches on the Company ID you provide and updates that company if it exists, otherwise creates a new one. Company ID cannot be changed after creation. Repeating with the same Company ID and fields converges on the same record, so it is effectively idempotent.',
		idempotent: true,
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

		const client = intercomClient(context.auth);

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
