import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';

export const createPreHireAction = createAction({
	auth: workdayAuth,
	name: 'create_pre_hire',
	classification: 'WRITE',
	displayName: 'Create Pre-Hire',
	description: 'Creates a new pre-hire record in Workday.',
	audience: 'both',
	aiMetadata: {
		description:
			'Creates a pre-hire/applicant record in Workday with legal name, contact details (email plus optional phone), and an ISO 3166-1 Alpha-3 country code. Use to register a candidate before running the Hire Employee action against them. Country is required by Workday. Not idempotent: each call submits a new applicant, with no key to update an existing one.',
		idempotent: false,
	},
	props: {
		firstName: Property.ShortText({
			displayName: 'First Name',
			description: 'Legal first name of the pre-hire.',
			required: true,
		}),
		lastName: Property.ShortText({
			displayName: 'Last Name',
			description: 'Legal last name of the pre-hire.',
			required: true,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Email address (at least one of email, phone, or address is required).',
			required: true,
		}),
		phone: Property.ShortText({
			displayName: 'Phone',
			description: 'Phone number.',
			required: false,
		}),
		country: Property.ShortText({
			displayName: 'Country',
			description:
				'ISO 3166-1 Alpha-3 country code (e.g., "USA", "GBR", "DEU"). Required by Workday.',
			required: true,
			defaultValue: 'USA',
		}),
	},
	async run({ auth, propsValue }) {
		return await workdayApi.createPreHire({
			auth,
			firstName: propsValue.firstName,
			lastName: propsValue.lastName,
			email: propsValue.email,
			phone: propsValue.phone,
			country: propsValue.country,
		});
	},
});
