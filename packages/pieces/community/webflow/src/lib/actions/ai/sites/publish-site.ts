import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowPublishSiteOutputSchema } from '../../../output-schemas';

export const publishSiteAction = createAction({
	auth: webflowAuth,
	name: 'webflow_publish_site',
	outputSchema: webflowPublishSiteOutputSchema,
	displayName: 'Publish Site',
	description: 'Publishes a site, or one page of it, to its webflow.io subdomain and custom domains.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Publishes the current version of a site live, to its webflow.io subdomain and/or the custom domains given (ids from List Custom Domains). Set Page ID to publish one page only. At least one target is required. Webflow allows one publish per minute per site.',
		idempotent: true,
	},
	props: {
		siteId: webflowAiProps.siteId({ required: true }),
		publishToWebflowSubdomain: webflowAiProps.flag({
			required: false,
			displayName: 'Publish to webflow.io Subdomain',
			description: "Whether to publish to the site's webflow.io subdomain.",
		}),
		customDomainIds: Property.Array({
			displayName: 'Custom Domain IDs',
			description: 'Ids of the custom domains to publish to. Use List Custom Domains to find them.',
			required: false,
		}),
		pageId: Property.ShortText({
			displayName: 'Page ID',
			description: 'Publish only this page. Use List Pages to find it. Leave empty to publish the whole site.',
			required: false,
		}),
	},
	async run(context) {
		const { siteId, publishToWebflowSubdomain, customDomainIds, pageId } = context.propsValue;
		const customDomains = (customDomainIds ?? []).map((id) => String(id));
		if (publishToWebflowSubdomain !== 'true' && customDomains.length === 0) {
			throw new Error('Set publishToWebflowSubdomain to "true" or give at least one id in customDomainIds.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/v2/sites/${encodeURIComponent(siteId)}/publish`,
			body: {
				customDomains,
				...(publishToWebflowSubdomain !== undefined
					? { publishToWebflowSubdomain: publishToWebflowSubdomain === 'true' }
					: {}),
				...(pageId ? { pageId } : {}),
			},
		});
	},
});
