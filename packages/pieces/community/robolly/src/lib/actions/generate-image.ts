import { createAction, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../auth';
import { robollyApi } from '../common/api';
import { robollyProps } from '../common/props';
import { generateImageOutputSchema } from '../output-schemas';

const formatOptions = [
	{ label: 'JPG', value: 'jpg' },
	{ label: 'PNG', value: 'png' },
	{ label: 'PDF', value: 'pdf' },
];

export const generateImageAction = createAction({
	description: 'Generate an image using Robolly',
	audience: 'human',
	aiMetadata: {
		description:
			"Renders a personalized asset (JPG, PNG, or PDF, set via the format input) from a Robolly template by filling its template fields with the supplied values, plus any extra modifications. Use when an agent needs to produce a finished image/PDF from a design template; requires a template ID and the values for that template's accepted fields. Each call produces a new render and consumes a generation, so it is not idempotent.",
		idempotent: false,
	},
	displayName: 'Generate Image',
	name: 'generate_image',
	outputSchema: generateImageOutputSchema,
	classification: 'READ',
	auth: robollyAuth,
	props: {
		template_id: robollyProps.templateId({ required: true }),
		format: Property.StaticDropdown({
			displayName: 'Format',
			required: true,
			description: 'The format of the image to generate.',
			defaultValue: 'jpg',
			options: {
				options: formatOptions,
			},
		}),
		fields: robollyProps.templateFields({ required: true }),
		modifications: Property.Object({
			displayName: 'Extra Modifications',
			description:
				'The extra modifications to apply to the image. See "Detailed dynamic modifications" in https://robolly.com/docs/api-reference/',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await robollyApi.renderTemplate({
			auth,
			templateId: propsValue.template_id,
			format: propsValue.format,
			modifications: propsValue.modifications,
			fields: propsValue.fields,
		});
	},
});
