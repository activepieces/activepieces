import { quickBooksAuth } from '../../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { CreateCustomerParameters } from '../../common/types';
import { QuickBooksAPIClient } from '../../common/client';
import { quickbooksProps } from '../../common/props';

export const createCustomerAction = createAction({
	auth: quickBooksAuth,
	name: 'quickbooks_create_customer',
	displayName: 'Create Customer',
	description: 'Adds a new customer.',
	props: {
		DisplayName: Property.ShortText({
			displayName: 'Display Name',
			required: true,
		}),
		...quickbooksProps.customer,
	},
	async run(context) {
		const params: CreateCustomerParameters = {
			DisplayName: context.propsValue.DisplayName,
			Title: context.propsValue.Title,
			GivenName: context.propsValue.GivenName,
			MiddleName: context.propsValue.MiddleName,
			FamilyName: context.propsValue.FamilyName,
			CompanyName: context.propsValue.CompanyName,
			PrintOnCheckName: context.propsValue.PrintOnCheckName,
			PrimaryEmailAddr: context.propsValue.Email
				? {
						Address: context.propsValue.Email,
				  }
				: undefined,
			PrimaryPhone: context.propsValue.PrimaryPhone
				? {
						FreeFormNumber: context.propsValue.PrimaryPhone,
				  }
				: undefined,
			AlternatePhone: context.propsValue.AlternatePhone
				? {
						FreeFormNumber: context.propsValue.AlternatePhone,
				  }
				: undefined,
			Mobile: context.propsValue.Mobile
				? {
						FreeFormNumber: context.propsValue.Mobile,
				  }
				: undefined,
			Fax: context.propsValue.Fax
				? {
						FreeFormNumber: context.propsValue.Fax,
				  }
				: undefined,
			WebAddr: context.propsValue.WebAddr
				? {
						URI: context.propsValue.WebAddr,
				  }
				: undefined,
			BillAddr: {
				Line1: context.propsValue.BillAddrLine1,
				Line2: context.propsValue.BillAddrLine2,
				City: context.propsValue.BillAddrCity,
				PostalCode: context.propsValue.BillAddrPostalCode,
				Country: context.propsValue.BillAddrCountry,
				CountrySubDivisionCode: context.propsValue.BillAddrCountrySubDivisionCode,
			},
			ShipAddr: {
				Line1: context.propsValue.ShipAddrLine1,
				Line2: context.propsValue.ShipAddrLine2,
				City: context.propsValue.ShipAddrCity,
				PostalCode: context.propsValue.ShipAddrPostalCode,
				Country: context.propsValue.ShipAddrCountry,
				CountrySubDivisionCode: context.propsValue.ShipAddrCountrySubDivisionCode,
			},
			Notes: context.propsValue.Notes,
			ParentRef: context.propsValue.ParentRef
				? {
						value: context.propsValue.ParentRef,
				  }
				: undefined,
			Job: context.propsValue.Job,
			CurrencyRef: context.propsValue.CurrencyRef
				? {
						value: context.propsValue.CurrencyRef,
				  }
				: undefined,
			BillWithParent: context.propsValue.BillWithParent,
			PaymentMethodRef: context.propsValue.PaymentMethodRef
				? {
						value: context.propsValue.PaymentMethodRef,
				  }
				: undefined,
			PreferredDeliveryMethod: context.propsValue.PreferredDeliveryMethod,
			SalesTermRef: context.propsValue.SalesTermRef
				? {
						value: context.propsValue.SalesTermRef,
				  }
				: undefined,
		};

		const client = new QuickBooksAPIClient({
			accessToken: context.auth.access_token,
			companyId: context.auth.props?.['companyId'],
		});

		return await client.customers.create(params);
	},
});
