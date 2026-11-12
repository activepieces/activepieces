import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxUpdateVendorOutputSchema } from '../../../output-schemas';

export const updateVendorAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_vendor',
	outputSchema: quickbooksSandboxUpdateVendorOutputSchema,
	displayName: 'Update Vendor',
	description: 'Changes fields of an existing vendor.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the fields you set on one vendor: reads the vendor, applies your changes and sends the whole record back, so unset fields keep their values. Vendors cannot be deleted in QuickBooks: set Active to No to deactivate one. Get the id from List Vendors.',
		idempotent: true,
	},
	props: {
		vendorId: quickbooksAiProps.id({
			required: true,
			displayName: 'Vendor ID',
			description: 'QuickBooks vendor id. Use List Vendors to find it.',
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
		accountNumber: Property.ShortText({ displayName: 'Account Number', description: 'New account number.', required: false }),
		vendor1099: quickbooksAiProps.flag({
			required: false,
			displayName: 'Track 1099',
			description: 'Yes if this vendor is tracked for 1099 reporting (US).',
		}),
		active: quickbooksAiProps.flag({
			required: false,
			displayName: 'Active',
			description: 'Set to No to deactivate the vendor, Yes to reactivate it.',
		}),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const {
			vendorId,
			displayName,
			givenName,
			familyName,
			companyName,
			email,
			phone,
			accountNumber,
			vendor1099,
			active,
			additionalFields,
		} = context.propsValue;
		return await quickbooksApi.replaceEntity({
			auth: context.auth,
			entity: 'Vendor',
			id: vendorId,
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
							AcctNum: accountNumber,
							Vendor1099: quickbooksUtils.flagValue({ value: vendor1099, propName: 'Track 1099' }),
							Active: quickbooksUtils.flagValue({ value: active, propName: 'Active' }),
						},
					}),
				},
			}),
		});
	},
});


