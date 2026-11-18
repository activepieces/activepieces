import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../auth';
import { quickbooksClient } from '../common/client';
import { quickbooksProps } from '../common/props';
import type { QuickbooksFault, QuickbooksVendor } from '../common/types';
import { createVendorOutputSchema } from '../output-schemas';

export const createVendorAction = createAction({
	auth: quickbooksAuth,
	name: 'create_vendor',
	outputSchema: createVendorOutputSchema,
	displayName: 'Create Vendor',
	description: 'Creates a vendor in QuickBooks.',
	audience: 'human',
	aiMetadata: {
		description: 'Create a new QuickBooks vendor with a display name and optional company name, email, phone, billing address, 1099 tracking flag, tax identifier, account number, and payment term. Not idempotent: each call creates a new vendor, so guard against duplicates (e.g. with Find Vendor first).',
		idempotent: false,
	},
	props: {
		displayName: Property.ShortText({
			displayName: 'Vendor Display Name',
			description: 'The name QuickBooks will show for this vendor. Must be unique across all vendors, customers, and employees.',
			required: true,
		}),
		companyName: Property.ShortText({
			displayName: 'Company Name',
			required: false,
		}),
		email: Property.ShortText({
			displayName: 'Email Address',
			required: false,
		}),
		phone: Property.ShortText({
			displayName: 'Phone Number',
			required: false,
		}),
		billAddrLine1: Property.ShortText({
			displayName: 'Billing Address Line 1',
			required: false,
		}),
		billAddrCity: Property.ShortText({
			displayName: 'Billing Address City',
			required: false,
		}),
		billAddrState: Property.ShortText({
			displayName: 'Billing Address State',
			description: 'State or province code, e.g. CA.',
			required: false,
		}),
		billAddrPostalCode: Property.ShortText({
			displayName: 'Billing Address Postal Code',
			required: false,
		}),
		vendor1099: Property.Checkbox({
			displayName: 'Track for 1099',
			description: 'Whether this vendor should be tracked for 1099 reporting.',
			required: false,
			defaultValue: false,
		}),
		taxIdentifier: Property.ShortText({
			displayName: 'Tax ID (SSN or EIN)',
			required: false,
		}),
		acctNum: Property.ShortText({
			displayName: 'Account Number',
			description: 'Your own reference/account number for this vendor (external ID). Shown on checks.',
			required: false,
		}),
		termRef: quickbooksProps.termRef({ required: false }),
	},
	async run(context) {
		if (!context.auth.props?.['companyId']) {
			throw new Error('Realm ID not found in authentication data. Please reconnect your account.');
		}

		const props = context.propsValue;

		const billAddr =
			props['billAddrLine1'] || props['billAddrCity'] || props['billAddrState'] || props['billAddrPostalCode']
				? {
						...(props['billAddrLine1'] && { Line1: props['billAddrLine1'] }),
						...(props['billAddrCity'] && { City: props['billAddrCity'] }),
						...(props['billAddrState'] && { CountrySubDivisionCode: props['billAddrState'] }),
						...(props['billAddrPostalCode'] && { PostalCode: props['billAddrPostalCode'] }),
				  }
				: undefined;

		const vendorPayload: Partial<QuickbooksVendor> = {
			DisplayName: props['displayName'],
			...(props['companyName'] && { CompanyName: props['companyName'] }),
			...(props['email'] && { PrimaryEmailAddr: { Address: props['email'] } }),
			...(props['phone'] && { PrimaryPhone: { FreeFormNumber: props['phone'] } }),
			...(billAddr && { BillAddr: billAddr }),
			...(props['vendor1099'] !== undefined && { Vendor1099: props['vendor1099'] }),
			...(props['taxIdentifier'] && { TaxIdentifier: props['taxIdentifier'] }),
			...(props['acctNum'] && { AcctNum: props['acctNum'] }),
			...(props['termRef'] && { TermRef: { value: props['termRef'] } }),
		};

		const response = await quickbooksClient.request<{
			Vendor: QuickbooksVendor;
			time: string;
			Fault?: QuickbooksFault;
		}>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/vendor',
			body: vendorPayload,
		});

		if (response.Fault) {
			throw new Error(
				`QuickBooks API Error creating vendor: ${response.Fault.Error.map(
					(e) => e.Message,
				).join(', ')} - Detail: ${response.Fault.Error.map((e) => e.Detail).join(', ')}`,
			);
		}

		return response.Vendor;
	},
});
