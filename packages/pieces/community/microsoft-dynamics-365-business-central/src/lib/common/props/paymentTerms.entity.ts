import { Property } from '@activepieces/pieces-framework';

export const paymentTermsEntityProps = {
	code: Property.ShortText({
		displayName: 'Code',
		description: 'The code of the payment term.',
		required: false,
	}),
	displayName: Property.ShortText({
		displayName: 'Display Name',
		description:
			"Specifies the payment term's name. This name will appear on all sales documents for the payment term.",
		required: false,
	}),
	dueDateCalculation: Property.ShortText({
		displayName: 'Due Date Calculation',
		description:
			'Specifies the formula that is used to calculate the date that a payment must be made.',
		required: false,
	}),
	discountDateCalculation: Property.ShortText({
		displayName: 'Discount Date Calculation',
		required: false,
		description:
			'Specifies the formula that is used to calculate the date that a payment must be made in order to obtain a discount.',
	}),
	discountPercent: Property.Number({
		displayName: 'Discount Percent',
		required: false,
	}),
	calculateDiscountOnCreditMemos: Property.Checkbox({
		displayName: 'Calc. Pmt. Disc. on Credit Memos',
		required: false,
		description:
			'Specifies if the discount should be applied to payment term. True indicates a discount will be given, false indicates a discount will not be given.',
	}),
};
