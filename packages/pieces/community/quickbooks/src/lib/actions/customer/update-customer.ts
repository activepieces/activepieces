import { quickBooksAuth } from '../../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { UpdateCustomerParameters } from '../../common/types';
import { QuickBooksAPIClient } from '../../common/client';
import { quickbooksProps } from '../../common/props';
import { quickBooksCommon } from '../../common';

export const updateCustomerAction = createAction({
	auth: quickBooksAuth,
	name: 'quickbooks_update_customer',
	displayName: 'Update Customer',
	description: 'Updates an existing customer.',
	props: {
		customerId: quickBooksCommon.customerId(true, 'Customer'),
		DisplayName: Property.ShortText({
			displayName: 'Display Name',
			required: false,
		}),
		...quickbooksProps.customer,
	},
	async run(context) {
		const client = new QuickBooksAPIClient({
			accessToken: context.auth.access_token,
			companyId: context.auth.props?.['companyId'],
		});

		// retrive syncToken for update operation
		const customer = await client.customers.retrieve({
			customerId: context.propsValue.customerId!,
		});

		const params: UpdateCustomerParameters = {
			Id: context.propsValue.customerId!,
			SyncToken: customer.Customer.SyncToken,
			sparse: true,
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
				Line1: context.propsValue.BillAddrLine1 ?? customer.Customer.BillAddr.Line1,
				Line2: context.propsValue.BillAddrLine2 ?? customer.Customer.BillAddr.Line2,
				City: context.propsValue.BillAddrCity ?? customer.Customer.BillAddr.City,
				PostalCode: context.propsValue.BillAddrPostalCode ?? customer.Customer.BillAddr.PostalCode,
				Country: context.propsValue.BillAddrCountry ?? customer.Customer.BillAddr.Country,
				CountrySubDivisionCode:
					context.propsValue.BillAddrCountrySubDivisionCode ??
					customer.Customer.BillAddr.CountrySubDivisionCode,
			},
			ShipAddr: {
				Line1: context.propsValue.ShipAddrLine1 ?? customer.Customer.ShipAddr.Line1,
				Line2: context.propsValue.ShipAddrLine2 ?? customer.Customer.ShipAddr.Line2,
				City: context.propsValue.ShipAddrCity ?? customer.Customer.ShipAddr.City,
				PostalCode: context.propsValue.ShipAddrPostalCode ?? customer.Customer.ShipAddr.PostalCode,
				Country: context.propsValue.ShipAddrCountry ?? customer.Customer.ShipAddr.Country,
				CountrySubDivisionCode:
					context.propsValue.ShipAddrCountrySubDivisionCode ??
					customer.Customer.ShipAddr.CountrySubDivisionCode,
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

		return await client.customers.update(params);
	},
});
