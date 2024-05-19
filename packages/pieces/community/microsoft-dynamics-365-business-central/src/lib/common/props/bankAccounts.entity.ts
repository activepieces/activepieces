import { Property } from '@activepieces/pieces-framework';

export const bankAccountsEntityProps = {
	number: Property.ShortText({
		displayName: 'Number',
		required: false,
	}),
	displayName: Property.ShortText({
		displayName: 'Display Name',
		required: false,
	}),
	bankAccountNumber: Property.ShortText({
		displayName: 'Bank Account Number',
		required: false,
	}),
	blocked: Property.Checkbox({
		displayName: 'Blocked ?',
		description:
			'Specifies that entries cannot be posted to the bank account. True indicates account is blocked and posting is not allowed.',
		required: false,
	}),
	currencyCode: Property.ShortText({
		displayName: 'Currency Code',
		required: false,
		description: 'The default currency code for the bank account.',
	}),
	currencyId: Property.ShortText({
		displayName: 'Currency ID',
		required: false,
	}),
	iban: Property.ShortText({
		displayName: 'IBAN',
		required: false,
	}),
};
