import { createAction, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyAiProps } from '../../common/ai-props';
import { robollyApi } from '../../common/api';

const formatOptions = [
	{ label: 'JPG', value: 'jpg' },
	{ label: 'PNG', value: 'png' },
	{ label: 'PDF', value: 'pdf' },
	{ label: 'MP4', value: 'mp4' },
];

export const renderTemplateAction = createAction({
	auth: robollyAuth,
	name: 'robolly_render_template',
	displayName: 'Render Template',
	description: 'Renders a template as an image, PDF or MP4 and returns the file URL.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renders a Robolly template with the given element values and returns the rendered file URL. Get the template ID from List Templates and the modification keys from List Template Elements. Each call uses render credits.',
		idempotent: false,
	},
	props: {
		templateId: robollyAiProps.templateId({ required: true }),
		format: Property.StaticDropdown({
			displayName: 'Format',
			description: 'The output format. MP4 only works for animated templates.',
			required: true,
			defaultValue: 'jpg',
			options: { options: formatOptions },
		}),
		modifications: robollyAiProps.modifications({ required: false }),
		scale: Property.Number({
			displayName: 'Scale',
			description: 'Output scale from 0.1 to 3. Defaults to 1.',
			required: false,
		}),
		quality: Property.Number({
			displayName: 'Quality',
			description: 'Compression quality from 10 to 100, JPG only.',
			required: false,
		}),
		dpi: Property.Number({
			displayName: 'DPI',
			description: 'DPI from 1 to 1200, JPG and PNG only.',
			required: false,
		}),
		fps: Property.Number({
			displayName: 'FPS',
			description: 'Frames per second for MP4: 24, 30, 50 or 60.',
			required: false,
		}),
		duration: Property.Number({
			displayName: 'Duration',
			description: 'Video length in milliseconds for MP4, up to 10000.',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		return await robollyApi.renderTemplateLink({
			auth,
			templateId: propsValue.templateId,
			format: propsValue.format,
			modifications: propsValue.modifications,
			options: {
				scale: propsValue.scale,
				q: propsValue.quality,
				dpi: propsValue.dpi,
				fps: propsValue.fps,
				duration: propsValue.duration,
			},
		});
	},
});
