import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateCustomerOutputSchema } from '../../../output-schemas';

export const createCustomerAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_customer',
	outputSchema: quickbooksSandboxCreateCustomerOutputSchema,
	displayName: 'Create Customer',
	description: 'Creates a customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a customer. Display Name must be unique across all customers, vendors and employees, so check List Customers first; a sub-customer or job goes in Additional Fields with ParentRef and Job. Customer type ids come from List Customer Types. Not idempotent: each call creates a new customer.',
		idempotent: false,
	},
	props: {
		displayName: Property.ShortText({
			displayName: 'Display Name',
			description: 'Name shown in QuickBooks lists. Must be unique across customers, vendors and employees.',
			required: true,
		}),
		givenName: Property.ShortText({ displayName: 'First Name', description: 'First name of the contact person.', required: false }),
		familyName: Property.ShortText({ displayName: 'Last Name', description: 'Last name of the contact person.', required: false }),
		companyName: Property.ShortText({ displayName: 'Company Name', description: 'Name of the customer\'s company.', required: false }),
		email: Property.ShortText({ displayName: 'Email', description: 'Primary email address.', required: false }),
		phone: Property.ShortText({ displayName: 'Phone', description: 'Primary phone number, in any format.', required: false }),
		customerTypeId: quickbooksAiProps.id({
			required: false,
			displayName: 'Customer Type ID',
			description: 'QuickBooks customer type id. Use List Customer Types to find it.',
		}),
		notes: Property.LongText({ displayName: 'Notes', description: 'Free-form notes about the customer.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({
			required: false,
			description:
				'Optional JSON object with any other Customer fields, in QuickBooks\' own field names, e.g. {"BillAddr": {"Line1": "123 Main St", "City": "Mountain View", "CountrySubDivisionCode": "CA", "PostalCode": "94042"}, "ParentRef": {"value": "58"}, "Job": true}. The dedicated inputs override the same fields here.',
		}),
	},
	async run(context) {
		const { displayName, givenName, familyName, companyName, email, phone, customerTypeId, notes, additionalFields } =
			context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Customer',
			body: {
				...additionalFields,
				...quickbooksUtils.compact({
					fields: {
						DisplayName: displayName,
						GivenName: givenName,
						FamilyName: familyName,
						CompanyName: companyName,
						PrimaryEmailAddr: email ? { Address: email } : undefined,
						PrimaryPhone: phone ? { FreeFormNumber: phone } : undefined,
						CustomerTypeRef: quickbooksUtils.ref({ value: customerTypeId }),
						Notes: notes,
					},
				}),
			},
		});
	},
});
