import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateCustomFontOutputSchema } from '../../../output-schemas';

export const updateCustomFontAction = createAction({
	auth: webflowAuth,
	name: 'webflow_update_custom_font',
	outputSchema: webflowCreateCustomFontOutputSchema,
	displayName: 'Update Custom Font',
	description: "Updates a custom font's family, weight, style or font-display.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a custom font's metadata; only the fields set are sent and at least one is required. The font file itself is not changed. Get the site id from List Sites and the font id from List Custom Fonts.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		fontId: Property.ShortText({
			displayName: 'Font ID',
			description: 'Custom font ID. Use List Custom Fonts to find it.',
			required: true,
		}),
		fontFamily: Property.ShortText({
			displayName: 'Font Family',
			description: 'CSS font-family name, 1-256 characters. Webflow strips commas.',
			required: false,
		}),
		weight: Property.Number({
			displayName: 'Weight',
			description: 'CSS font-weight, 1-1000, e.g. 400 for regular or 700 for bold.',
			required: false,
		}),
		italic: webflowAiProps.flag({
			required: false,
			displayName: 'Italic',
			description: 'Whether the font is italic.',
		}),
		fontDisplay: Property.StaticDropdown({
			displayName: 'Font Display',
			description: 'CSS font-display value.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Auto', value: 'auto' },
					{ label: 'Block', value: 'block' },
					{ label: 'Swap', value: 'swap' },
					{ label: 'Fallback', value: 'fallback' },
					{ label: 'Optional', value: 'optional' },
				],
			},
		}),
	},
	async run(context) {
		const { siteId, fontId, fontFamily, weight, italic, fontDisplay } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.PATCH,
			path: `/v2/sites/${encodeURIComponent(siteId)}/custom_fonts/${encodeURIComponent(fontId)}`,
			body: {
				...(fontFamily !== undefined ? { fontFamily } : {}),
				...(weight !== undefined ? { weight } : {}),
				...(italic !== undefined ? { italic: italic === 'true' } : {}),
				...(fontDisplay !== undefined ? { fontDisplay } : {}),
			},
		});
	},
});
