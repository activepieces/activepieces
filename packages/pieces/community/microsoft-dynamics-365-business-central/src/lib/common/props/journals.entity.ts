import { Property } from '@activepieces/pieces-framework';

export const journalsEntityProps = {
	code: Property.ShortText({
		displayName: 'Code',
		description: 'The code of the journal.',
		required: false,
	}),
	displayName: Property.ShortText({
		displayName: 'Display Name',
		description:
			"Specifies the journal's name. This name will appear on all sales documents for the journal.",
		required: false,
	}),
	balancingAccountNumber: Property.ShortText({
		displayName: 'Balancing Account Number',
		required: false,
	}),
};
