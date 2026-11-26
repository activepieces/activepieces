import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../auth';
import { robollyApi } from '../common/api';
import { robollyProps } from '../common/props';
import { generateImageOutputSchema } from '../output-schemas';

const formatOptions = [
	{ label: 'JPG', value: 'jpg', description: 'Compressed' },
	{ label: 'PNG', value: 'png', description: 'Lossless' },
	{ label: 'PDF', value: 'pdf', description: 'Printable' },
];

export const generateImageAction = createAction({
	description: 'Render a JPG, PNG or PDF from one of your templates.',
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
			display: 'cards',
			defaultValue: 'jpg',
			options: {
				options: formatOptions,
			},
		}),
		values_info: Property.MarkDown({
			value: "Fields left empty keep the template's own content.",
			variant: MarkdownVariant.INFO,
		}),
		fields: robollyProps.templateFields({ required: true }),
		modifications: Property.Object({
			displayName: 'Extra Modifications',
			description: 'Other element settings to override, e.g. title.color → #FF0000.',
			advanced: true,
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
