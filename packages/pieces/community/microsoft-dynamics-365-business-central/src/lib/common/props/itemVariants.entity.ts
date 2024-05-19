import { Property } from '@activepieces/pieces-framework';

export const itemVariantsEntityProps = {
	itemId: Property.ShortText({
		displayName: 'Item ID',
		required: false,
	}),
	code: Property.ShortText({
		displayName: 'Code',
		description: 'The code of the item variant.',
		required: false,
	}),
	description: Property.ShortText({
		displayName: 'Description',
		description: 'Specifies the description of the item variant.',
		required: false,
	}),
};
