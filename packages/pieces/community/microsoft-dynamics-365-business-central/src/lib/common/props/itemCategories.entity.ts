import { Property } from '@activepieces/pieces-framework';

export const itemCategoriesEntityProps = {
	code: Property.ShortText({
		displayName: 'Code',
		description: 'The code of the item category.',
		required: false,
	}),
	displayName: Property.ShortText({
		displayName: 'Display Name',
		description:
			"Specifies the item category's name. This name will appear on all sales documents for the item category.",
		required: false,
	}),
};
