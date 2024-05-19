import { Property } from '@activepieces/pieces-framework';

export const disputeStatusEntityProps = {
	code: Property.ShortText({
		displayName: 'Code',
		description: 'The code of the dispute status.',
		required: false,
	}),
	displayName: Property.ShortText({
		displayName: 'Display Name',
		description: `Specifies the dispute status's name. This name will appear on all sales documents for the dispute status.`,
		required: false,
	}),
};
