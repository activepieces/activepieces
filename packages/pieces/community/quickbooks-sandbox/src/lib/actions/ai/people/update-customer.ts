import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateCustomerOutputSchema } from '../../../output-schemas';

export const updateCustomerAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_customer',
	outputSchema: quickbooksSandboxCreateCustomerOutputSchema,
	displayName: 'Update Customer',
	description: 'Changes fields of an existing customer.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on one customer (a sparse update); the latest SyncToken is read first. Customers cannot be deleted in QuickBooks: set Active to No to deactivate one. Get the id from List Customers.',
		idempotent: true,
	},
	props: {
		customerId: quickbooksAiProps.id({
			required: true,
			displayName: 'Customer ID',
			description: 'QuickBooks customer id. Use List Customers to find it.',
		}),
		displayName: Property.ShortText({
			displayName: 'Display Name',
			description: 'New display name. Must be unique across customers, vendors and employees.',
			required: false,
		}),
		givenName: Property.ShortText({ displayName: 'First Name', description: 'New first name.', required: false }),
		familyName: Property.ShortText({ displayName: 'Last Name', description: 'New last name.', required: false }),
		companyName: Property.ShortText({ displayName: 'Company Name', description: 'New company name.', required: false }),
		email: Property.ShortText({ displayName: 'Email', description: 'New primary email address.', required: false }),
		phone: Property.ShortText({ displayName: 'Phone', description: 'New primary phone number.', required: false }),
		customerTypeId: quickbooksAiProps.id({
			required: false,
			displayName: 'Customer Type ID',
			description: 'New customer type id. Use List Customer Types to find it.',
		}),
		notes: Property.LongText({ displayName: 'Notes', description: 'New notes.', required: false }),
		active: quickbooksAiProps.flag({
			required: false,
			displayName: 'Active',
			description: 'Set to No to deactivate the customer, Yes to reactivate it.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const {
			customerId,
			displayName,
			givenName,
			familyName,
			companyName,
			email,
			phone,
			customerTypeId,
			notes,
			active,
			additionalFields,
		} = context.propsValue;
		return await quickbooksApi.updateEntity({
			auth: context.auth,
			entity: 'Customer',
			id: customerId,
			fields: quickbooksUtils.requireChanges({
				fields: {
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
							Active: quickbooksUtils.flagValue({ value: active, propName: 'Active' }),
						},
					}),
				},
			}),
		});
	},
});

