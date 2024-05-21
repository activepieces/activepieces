import { Property } from '@activepieces/pieces-framework';

export const salesOrdersEntityProps = {
	number: Property.ShortText({
		displayName: 'Number',
		required: false,
	}),
	orderDate: Property.DateTime({
		displayName: 'Order Date',
		required: false,
	}),
	postingDate: Property.DateTime({
		displayName: 'Posting Date',
		required: false,
	}),
	customerId: Property.ShortText({
		displayName: 'Customer ID',
		required: false,
	}),
	customerNumber: Property.ShortText({
		displayName: 'Customer Number',
		required: false,
	}),
	customerName: Property.ShortText({
		displayName: 'Customer Name',
		required: false,
	}),
	billToName: Property.ShortText({
		displayName: 'Bill to Name',
		required: false,
	}),
	billToCustomerId: Property.ShortText({
		displayName: 'Bill to Customer ID',
		required: false,
	}),
	billToCustomerNumber: Property.ShortText({
		displayName: 'Bill to Customer Number',
		required: false,
	}),
	shipToName: Property.ShortText({
		displayName: 'Ship to Name',
		required: false,
	}),
	shipToContact: Property.ShortText({
		displayName: 'SHip to Contact',
		required: false,
	}),
	sellToAddressLine1: Property.ShortText({
		displayName: 'Sell to Address Line 1',
		required: false,
	}),
	sellToAddressLine2: Property.ShortText({
		displayName: 'Sell to Address Line 2',
		required: false,
	}),
	sellToCity: Property.ShortText({
		displayName: 'Sell to City',
		required: false,
	}),
	sellToCountry: Property.ShortText({
		displayName: 'Sell to Country',
		required: false,
	}),
	sellToState: Property.ShortText({
		displayName: 'Sell to State',
		required: false,
	}),
	sellToPostCode: Property.ShortText({
		displayName: 'Sell to Postalcode',
		required: false,
	}),
	billToAddressLine1: Property.ShortText({
		displayName: 'Bill to Address Line 1',
		required: false,
	}),
	billToAddressLine2: Property.ShortText({
		displayName: 'Bill to Address Line 2',
		required: false,
	}),
	billToCity: Property.ShortText({
		displayName: 'Bill to City',
		required: false,
	}),
	billToCountry: Property.ShortText({
		displayName: 'Bill to Country',
		required: false,
	}),
	billToState: Property.ShortText({
		displayName: 'Bill to State',
		required: false,
	}),
	billToPostCode: Property.ShortText({
		displayName: 'Bill to Postalcode',
		required: false,
	}),
	shipToAddressLine1: Property.ShortText({
		displayName: 'Ship to Address Line 1',
		required: false,
	}),
	shipToAddressLine2: Property.ShortText({
		displayName: 'Ship to Address Line 2',
		required: false,
	}),
	shipToCity: Property.ShortText({
		displayName: 'Ship to City',
		required: false,
	}),
	shipToCountry: Property.ShortText({
		displayName: 'Ship to Country',
		required: false,
	}),
	shipToState: Property.ShortText({
		displayName: 'Ship to State',
		required: false,
	}),
	shipToPostCode: Property.ShortText({
		displayName: 'Ship to Postalcode',
		required: false,
	}),
	currencyId: Property.ShortText({
		displayName: 'Currency ID',
		required: false,
	}),
	currencyCode: Property.ShortText({
		displayName: 'Currency Code',
		required: false,
	}),
	pricesIncludeTax: Property.Checkbox({
		displayName: 'Prices Include Tax?',
		required: false,
	}),
	paymentTermsId: Property.ShortText({
		displayName: 'Payment Terms ID',
		required: false,
	}),
	shipmentMethodId: Property.ShortText({
		displayName: 'Shipment Method ID',
		required: false,
	}),
	salesperson: Property.ShortText({
		displayName: 'Sales Person',
		description: 'The salesperson code for the sales order.',
		required: false,
	}),
	partialShipping: Property.Checkbox({
		displayName: 'Specifies whether partial shipping of items is preferred or not.',
		required: false,
	}),
	requestedDeliveryDate: Property.ShortText({
		displayName: 'Requested Delivery Date',
		required: false,
	}),
	discountAmount: Property.Number({
		displayName: 'Discount Amount',
		description: 'The sales order discount amount.',
		required: false,
	}),
	discountAppliedBeforeTax: Property.Checkbox({
		displayName: 'Discount is applied before tax?',
		required: false,
	}),
	phoneNumber: Property.ShortText({
		displayName: 'Phone Number',
		description: "Specifies the sales order's telephone number.",
		required: false,
	}),
	email: Property.ShortText({
		displayName: 'Email',
		description: "Specifies the sales order's email address.",
		required: false,
	}),
	status: Property.StaticDropdown({
		displayName: 'Status',
		description: 'Specifies the status of the sales order. ',
		required: false,
		options: {
			disabled: false,
			options: [
				{
					label: 'Draft',
					value: 'Draft',
				},
				{
					label: 'Open',
					value: 'Open',
				},
				{
					label: 'Review',
					value: 'Review',
				},
			],
		},
	}),
	fullyShipped: Property.Checkbox({
		displayName: 'Fully Shipped?',
		description: 'Specifies whether the items of the sales order were fully shipped or not.',
		required: false,
	}),
};
