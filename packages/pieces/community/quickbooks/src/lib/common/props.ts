import { Property } from '@activepieces/pieces-framework';
import { quickBooksCommon } from '.';

export const quickbooksProps = {
	customer: {
		Title: Property.ShortText({
			displayName: 'Title',
			required: false,
		}),
		GivenName: Property.ShortText({
			displayName: 'First Name',
			required: false,
		}),
		MiddleName: Property.ShortText({
			displayName: 'Middle Name',
			required: false,
		}),
		FamilyName: Property.ShortText({
			displayName: 'Last Name',
			required: false,
		}),
		CompanyName: Property.ShortText({
			displayName: 'Company Name',
			required: false,
		}),
		PrintOnCheckName: Property.ShortText({
			displayName: 'Name to print on checks',
			required: false,
		}),
		Email: Property.ShortText({
			displayName: 'Email',
			required: false,
		}),
		PrimaryPhone: Property.ShortText({
			displayName: 'Phone',
			required: false,
		}),
		AlternatePhone: Property.ShortText({
			displayName: 'Alternate Phone',
			required: false,
		}),
		Mobile: Property.ShortText({
			displayName: 'Mobile',
			required: false,
		}),
		Fax: Property.ShortText({
			displayName: 'Fax',
			required: false,
		}),
		WebAddr: Property.ShortText({
			displayName: 'Website',
			required: false,
		}),
		BillAddrLine1: Property.ShortText({
			displayName: 'Billing Address Line 1',
			required: false,
		}),
		BillAddrLine2: Property.ShortText({
			displayName: 'Billing Address Line 2',
			required: false,
		}),
		BillAddrCity: Property.ShortText({
			displayName: 'Billing Address City',
			required: false,
		}),
		BillAddrCountrySubDivisionCode: Property.ShortText({
			displayName: 'Billing Address State Code',
			required: false,
		}),
		BillAddrPostalCode: Property.ShortText({
			displayName: 'Billing Address Zip Code',
			required: false,
		}),
		BillAddrCountry: Property.ShortText({
			displayName: 'Billing Address Country',
			required: false,
		}),
		ShipAddrLine1: Property.ShortText({
			displayName: 'Shipping Address Line 1',
			required: false,
		}),
		ShipAddrLine2: Property.ShortText({
			displayName: 'Shipping Address Line 2',
			required: false,
		}),
		ShipAddrCity: Property.ShortText({
			displayName: 'Shipping Address City',
			required: false,
		}),
		ShipAddrCountrySubDivisionCode: Property.ShortText({
			displayName: 'Shipping Address State Code',
			required: false,
		}),
		ShipAddrPostalCode: Property.ShortText({
			displayName: 'Shipping Address Zip Code',
			required: false,
		}),
		ShipAddrCountry: Property.ShortText({
			displayName: 'Shipping Address Country',
			required: false,
		}),
		Notes: Property.LongText({
			displayName: 'Notes',
			required: false,
		}),
		CurrencyRef: quickBooksCommon.companyCurrencyId(
			false,
			'Currency',
			'A three letter string representing the ISO 4217 code for the currency. For example, USD, AUD, EUR, and so on.',
		),
		ParentRef: quickBooksCommon.customerId(
			false,
			'Job/Parent Customer',
			"Choose a Parent Customer if you're creating a Job/sub-customer.",
		),
		Job: Property.Checkbox({
			displayName: 'Job',
			required: false,
			description:
				'If true, this is a Job or sub-customer. If false, this is a top level customer, not a Job or sub-customer.',
		}),
		BillWithParent: Property.Checkbox({
			displayName: 'Bill with Parent?',
			required: false,
		}),
		PaymentMethodRef: quickBooksCommon.paymentMethodId(false, 'Preferred Payment Method'),
		PreferredDeliveryMethod: Property.StaticDropdown({
			displayName: 'Preferred Payment Method',
			required: false,
			options: {
				disabled: false,
				options: [
					{
						label: 'Print later',
						value: 'Print',
					},
					{
						label: 'Send later',
						value: 'Email',
					},
					{
						label: 'None',
						value: 'None',
					},
				],
			},
		}),
		SalesTermRef: quickBooksCommon.termId(false, 'Terms'),
		ResaleNum: Property.ShortText({
			displayName: 'Tax Resale Number',
			required: false,
		}),
	},
};
