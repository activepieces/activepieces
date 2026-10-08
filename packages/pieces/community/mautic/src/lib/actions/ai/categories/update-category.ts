import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { mauticCreateCategoryOutputSchema } from './output-schemas';
import { mauticAuth } from '../../../auth';
import { mauticAiProps } from '../../../common/ai-props';
import { mauticApi } from '../../../common/api';

export const mauticUpdateCategoryAction = createAction({
	auth: mauticAuth,
	name: 'mautic_update_category',
	outputSchema: mauticCreateCategoryOutputSchema,
	displayName: 'Update Category',
	description: 'Updates fields of a Mautic category.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Updates an existing category. Only the fields given are changed.',
		idempotent: true,
	},
	props: {
		id: mauticAiProps.recordId({
			displayName: 'Category Id',
			description: 'Numeric category id, from List Categories or Create Category.',
		}),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		bundle: Property.StaticDropdown({
			displayName: 'Bundle',
			description: 'Where the category can be used. Global works everywhere.',
			required: false,
			options: {
				options: [
					{ label: 'Global', value: 'global' },
					{ label: 'Asset', value: 'asset' },
					{ label: 'Campaign', value: 'campaign' },
					{ label: 'Email', value: 'email' },
					{ label: 'Form', value: 'form' },
					{ label: 'Page', value: 'page' },
					{ label: 'Point', value: 'point' },
					{ label: 'Segment', value: 'segment' },
					{ label: 'Stage', value: 'stage' },
					{ label: 'Text Message', value: 'sms' },
					{ label: 'Dynamic Content', value: 'dynamicContent' },
					{ label: 'Focus', value: 'plugin:focus' },
					{ label: 'Marketing Message', value: 'messages' },
					{ label: 'Web Push', value: 'notification' },
				],
			},
		}),
		description: Property.LongText({ displayName: 'Description', required: false }),
		color: Property.ShortText({
			displayName: 'Color',
			description: 'Hex color without "#", e.g. "4e5d9d".',
			required: false,
		}),
		isPublished: mauticAiProps.yesNo({ displayName: 'Published' }),
		additionalFields: mauticAiProps.additionalFields({
			description:
				'Other category properties, e.g. "alias". The dedicated props above win over the same keys here.',
		}),
	},
	async run(context) {
		const { id, additionalFields, title, bundle, description, color, isPublished } =
			context.propsValue;
		return await mauticApi.updateRecord({
			auth: context.auth,
			resource: 'categories',
			id,
			body: {
				...additionalFields,
				...spreadIfDefined('title', title),
				...spreadIfDefined('bundle', bundle),
				...spreadIfDefined('description', description),
				...spreadIfDefined('color', color),
				...spreadIfDefined('isPublished', isPublished),
			},
		});
	},
});
