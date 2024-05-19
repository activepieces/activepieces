import { Property } from '@activepieces/pieces-framework';

export const itemsEntityProps = {
	number: Property.ShortText({
		displayName: 'Number',
		required: false,
	}),
	displayName: Property.ShortText({
		displayName: 'Display Name',
		required: false,
	}),
	type: Property.StaticDropdown({
		displayName: 'Type',
		required: false,
		options: {
			disabled: false,
			options: [
				{ label: 'Inventory', value: 'Inventory' },
				{ label: 'Service', value: 'Service' },
				{ label: 'Non-Inventory', value: 'Non-Inventory' },
			],
		},
	}),
	blocked: Property.Checkbox({
		displayName: 'Blocked?',
		required: false,
	}),
	itemCategoryId: Property.ShortText({
		displayName: 'Item Category ID',
		required: false,
	}),
	itemCategoryCode: Property.ShortText({
		displayName: 'Item Category Code',
		required: false,
	}),
	gtin: Property.ShortText({
		displayName: 'GTIN',
		required: false,
	}),
	unitPrice: Property.Number({
		displayName: 'Unit Price',
		required: false,
	}),
	priceIncludesTax: Property.Checkbox({
		displayName: 'Price Includes Tax?',
		description:
			'Specifies that the unitPrice includes tax. Set to true, if unitPrice includes tax.',
		required: false,
	}),
	unitCost: Property.Number({
		displayName: 'Unit Cost',
		required: false,
	}),
	taxGroupId: Property.ShortText({
		displayName: 'Tax Group ID',
		required: false,
	}),
	taxGroupCode: Property.ShortText({
		displayName: 'Tax Group Code',
		required: false,
	}),
	baseUnitOfMeasureId: Property.ShortText({
		displayName: 'Basic Unit of Measure ID',
		required: false,
	}),
	baseUnitOfMeasureCode: Property.ShortText({
		displayName: 'Basic Unit of Measure Code',
		required: false,
	}),
};
