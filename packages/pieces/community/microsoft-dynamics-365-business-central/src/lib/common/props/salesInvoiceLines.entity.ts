import { Property } from '@activepieces/pieces-framework';

//https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/resources/dynamics_salesinvoiceline
export const salesInvoiceLinesEntityProps = {
	sequence: Property.Number({
		displayName: 'Sequence Number',
		required: false,
	}),
	itemId: Property.ShortText({
		displayName: 'Item ID',
		description: 'The ID of the item in the sales invoice line.',
		required: false,
	}),
	accountId: Property.ShortText({
		displayName: 'Account ID',
		description: 'The id of the account that the sales invoice line is related to.',
		required: false,
	}),
	lineType: Property.StaticDropdown({
		displayName: 'Line Type',
		required: false,
		options: {
			disabled: false,
			options: [
				{
					label: 'Comment',
					value: 'Comment',
				},
				{
					label: 'Account',
					value: 'Account',
				},
				{
					label: 'Item',
					value: 'Item',
				},
				{
					label: 'Resource',
					value: 'Resource',
				},
				{
					label: 'Value',
					value: 'Value',
				},
				{
					label: 'Charge',
					value: 'Charge',
				},
				{
					label: 'Fixed Asset',
					value: 'Fixed Asset',
				},
			],
		},
	}),
	lineObjectNumber: Property.ShortText({
		displayName: 'Line Object Number',
		description: 'The number of the object (account or item) of the sales invoice line.',
		required: false,
	}),
	description: Property.ShortText({
		displayName: 'Description',
		required: false,
	}),
	unitOfMeasureId: Property.ShortText({
		displayName: 'Unit of Measure ID',
		required: false,
	}),
	unitOfMeasureCode: Property.ShortText({
		displayName: 'Unit of Measure Code',
		required: false,
	}),
	quantity: Property.Number({
		displayName: 'Quantity',
		required: false,
	}),
	unitPrice: Property.Number({
		displayName: 'Unit Price',
		required: false,
	}),
	discountAmount: Property.Number({
		displayName: 'Discount Number',
		required: false,
	}),
	discountPercent: Property.Number({
		displayName: 'Discount Percent',
		required: false,
	}),
	discountAppliedBeforeTax: Property.Checkbox({
		displayName: 'Discount Applied Befor Tax?',
		required: false,
	}),
	taxCode: Property.ShortText({
		displayName: 'Tax Code',
		required: false,
	}),
	shipmentDate: Property.ShortText({
		displayName: 'Shipment Date',
		required: false,
	}),
	itemVariantId: Property.ShortText({
		displayName: 'Item Variant ID',
		required: false,
	}),
};
