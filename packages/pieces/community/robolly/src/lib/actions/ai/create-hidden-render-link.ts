import { createAction, Property } from '@activepieces/pieces-framework';

import { robollyAuth } from '../../auth';
import { robollyAiProps } from '../../common/ai-props';
import { robollyApi } from '../../common/api';
import { robollyCreateHiddenRenderLinkOutputSchema } from '../../output-schemas';

const formatOptions = [
	{ label: 'JPG', value: 'jpg' },
	{ label: 'PNG', value: 'png' },
	{ label: 'PDF', value: 'pdf' },
];

export const createHiddenRenderLinkAction = createAction({
	auth: robollyAuth,
	name: 'robolly_create_hidden_render_link',
	outputSchema: robollyCreateHiddenRenderLinkOutputSchema,
	displayName: 'Create Hidden Render Link',
	description: 'Builds a signed render link that looks like a static file URL.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Builds a signed, static-looking render link for a template with the given element values, for embedding in public pages or emails. It sends no request; the template renders, and uses render credits, each time the link is opened. Use Render Template instead to render now and get the file URL.',
		idempotent: true,
	},
	props: {
		templateId: robollyAiProps.templateId({ required: true }),
		format: Property.StaticDropdown({
			displayName: 'Format',
			description: 'The output format.',
			required: true,
			defaultValue: 'jpg',
			options: { options: formatOptions },
		}),
		modifications: robollyAiProps.modifications({ required: false }),
	},
	async run({ auth, propsValue }) {
		return robollyApi.createHiddenRenderLink({
			auth,
			templateId: propsValue.templateId,
			format: propsValue.format,
			modifications: propsValue.modifications,
		});
	},
});
