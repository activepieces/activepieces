import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowCreateCollectionOutputSchema } from '../../../output-schemas';

export const createCollectionAction = createAction({
	auth: webflowAuth,
	name: 'webflow_create_collection',
	outputSchema: webflowCreateCollectionOutputSchema,
	displayName: 'Create Collection',
	description: 'Creates a CMS collection on a site.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a CMS collection on a site, optionally with its custom fields. Webflow adds the Name and Slug fields itself. Add more fields later with Create Collection Field. Collection names must be unique on the site. Get the site id from List Sites.',
		idempotent: false,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		displayName: Property.ShortText({
			displayName: 'Name',
			description: 'Plural name of the collection, e.g. "Blog Posts". Must be unique on the site.',
			required: true,
		}),
		singularName: Property.ShortText({
			displayName: 'Singular Name',
			description: 'Name of one item, e.g. "Blog Post".',
			required: true,
		}),
		slug: Property.ShortText({
			displayName: 'Slug',
			description: 'URL part for the collection, e.g. "blog-posts". Webflow derives it from the name when empty.',
			required: false,
		}),
		fields: Property.Json({
			displayName: 'Fields',
			description:
				'Custom fields as a JSON array, each {"type", "displayName", "isRequired"?, "helpText"?}. type is one of Color, DateTime, Email, File, Image, Link, MultiImage, Number, Phone, PlainText, RichText, Switch, VideoLink; Option needs "metadata": {"options": [{"name": "..."}]}; Reference and MultiReference need "metadata": {"collectionId": "..."}.',
			required: false,
		}),
	},
	async run(context) {
		const { siteId, displayName, singularName, slug, fields } = context.propsValue;
		if (fields !== undefined && !Array.isArray(fields)) {
			throw new Error('fields must be a JSON array of field objects.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/sites/${encodeURIComponent(siteId)}/collections`,
			body: {
				displayName,
				singularName,
				...(slug ? { slug } : {}),
				...(fields && fields.length > 0 ? { fields } : {}),
			},
		});
	},
});
