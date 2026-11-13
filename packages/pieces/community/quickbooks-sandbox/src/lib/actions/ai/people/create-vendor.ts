import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateVendorOutputSchema } from '../../../output-schemas';

export const createVendorAiAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_create_vendor',
	outputSchema: quickbooksSandboxCreateVendorOutputSchema,
	displayName: 'Create Vendor',
	description: 'Creates a vendor.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a vendor (a supplier you pay). Display Name must be unique across all customers, vendors and employees, so check List Vendors first. Not idempotent: each call creates a new vendor.',
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
		companyName: Property.ShortText({ displayName: 'Company Name', description: 'Name of the vendor\'s company.', required: false }),
		email: Property.ShortText({ displayName: 'Email', description: 'Primary email address.', required: false }),
		phone: Property.ShortText({ displayName: 'Phone', description: 'Primary phone number, in any format.', required: false }),
		accountNumber: Property.ShortText({
			displayName: 'Account Number',
			description: 'Your account number with this vendor, printed on checks.',
			required: false,
		}),
		vendor1099: quickbooksAiProps.flag({
			required: false,
			displayName: 'Track 1099',
			description: 'Yes if this vendor is tracked for 1099 reporting (US).',
		}),
		additionalFields: quickbooksAiProps.additionalFields({
			required: false,
			description:
				'Optional JSON object with any other Vendor fields, in QuickBooks\' own field names, e.g. {"BillAddr": {"Line1": "123 Main St", "City": "Mountain View", "CountrySubDivisionCode": "CA", "PostalCode": "94042"}, "TermRef": {"value": "3"}}. The dedicated inputs override the same fields here.',
		}),
	},
	async run(context) {
		const { displayName, givenName, familyName, companyName, email, phone, accountNumber, vendor1099, additionalFields } =
			context.propsValue;
		return await quickbooksApi.createEntity({
			auth: context.auth,
			entity: 'Vendor',
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
						AcctNum: accountNumber,
						Vendor1099: quickbooksUtils.flagValue({ value: vendor1099, propName: 'Track 1099' }),
					},
				}),
			},
		});
	},
});

