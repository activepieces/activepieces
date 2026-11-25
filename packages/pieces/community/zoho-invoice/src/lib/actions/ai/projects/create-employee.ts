import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoInvoiceAuth } from '../../../auth';
import { zohoInvoiceAiProps } from '../../../common/ai-props';
import { zohoInvoiceApi } from '../../../common/api';
import { zohoInvoiceCreateEmployeeOutputSchema } from '../../../output-schemas';

export const createEmployeeAction = createAction({
	auth: zohoInvoiceAuth,
	name: 'zoho_invoice_create_employee',
	outputSchema: zohoInvoiceCreateEmployeeOutputSchema,
	displayName: 'Create Employee',
	description: 'Adds an employee to a Zoho Invoice organization.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds an employee record, used to track who paid an expense; it sends no invitation and gives no login. Needs the Admin role. Not idempotent: each call creates another employee.',
		idempotent: false,
	},
	props: {
		organizationId: zohoInvoiceAiProps.organizationId({ required: true }),
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Full name of the employee.',
			required: true,
		}),
		email: Property.ShortText({
			displayName: 'Email',
			description: 'Email address of the employee.',
			required: true,
		}),
	},
	async run({ auth, propsValue }) {
		return await zohoInvoiceApi.createEmployee({
			auth,
			organizationId: propsValue.organizationId,
			body: { name: propsValue.name, email: propsValue.email },
		});
	},
});
