import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowGetComponentPropertiesOutputSchema } from '../../../output-schemas';

export const getComponentPropertiesAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_component_properties',
	outputSchema: webflowGetComponentPropertiesOutputSchema,
	displayName: 'Get Component Properties',
	description: 'Gets the properties of a component.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets a component's properties with each property's id, type, label and default text. Pages with limit and offset. Use Get Component Content for its nodes. Get the site id from List Sites and the component id from List Components.",
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		componentId: Property.ShortText({
			displayName: 'Component ID',
			description: 'Component ID. Use List Components to find it.',
			required: true,
		}),
		localeId: Property.ShortText({
			displayName: 'Locale ID',
			description: 'Locale ID to read. Leave empty for the primary locale.',
			required: false,
		}),
		translatable: Property.ShortText({
			displayName: 'Translatable Into Locale ID',
			description: 'Secondary locale ID you are translating into. Returns only content not excluded from translation for that locale.',
			required: false,
		}),
		branchId: Property.ShortText({
			displayName: 'Branch ID',
			description: 'Page branch ID to read from. Leave empty for the main site.',
			required: false,
		}),
		limit: webflowAiProps.limit({ required: false }),
		offset: webflowAiProps.offset({ required: false }),
	},
	async run(context) {
		const { siteId, componentId, localeId, translatable, branchId, limit, offset } = context.propsValue;
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: `/v2/sites/${encodeURIComponent(siteId)}/components/${encodeURIComponent(componentId)}/properties`,
			query: {
				limit: String(limit ?? 100),
				offset: String(offset ?? 0),
				...(localeId ? { localeId } : {}),
				...(translatable ? { translatable } : {}),
				...(branchId ? { branchId } : {}),
			},
		});
	},
});
