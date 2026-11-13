import { OutputSchema } from '@activepieces/pieces-framework';

import { categoryFields } from '../../../output-schemas';

export const mauticCreateCategoryOutputSchema: OutputSchema = {
	fields: [{ key: 'category', label: 'Category', children: categoryFields }],
};

export const mauticDeleteCategoryOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'category',
			label: 'Category',
			children: [
				{ key: 'id', label: 'ID' },
				{ key: 'title', label: 'Title' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'description', label: 'Description' },
				{ key: 'color', label: 'Color' },
				{ key: 'bundle', label: 'Bundle' },
			],
		},
	],
};

export const mauticListCategoriesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'categories', label: 'Categories', labelKey: 'title', listItems: categoryFields },
	],
};
