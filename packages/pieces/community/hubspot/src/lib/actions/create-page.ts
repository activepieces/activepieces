import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pageType } from '../common/props';
import { pageOutputSchema } from '../output-schemas';

export const createPageAction = createAction({
	auth: hubspotAuth,
	name: 'create-page',
	classification: 'WRITE',
	displayName: 'Create Page',
	description: 'Creates a landing page or site page.',
	audience: 'both',
	aiMetadata: { description: 'Create a new HubSpot CMS landing page or site page (choose via Page Type) from a template, then optionally publish it when State is set to publish rather than leaving it as a draft. Each call creates a distinct page, so it is not idempotent.', idempotent: false },
	outputSchema: pageOutputSchema,
	props: {
		pageType: pageType,
		pageTitle: Property.ShortText({
			displayName: 'Page Title',
			required: true,
		}),
		internalPageName: Property.ShortText({
			displayName: 'Internal Page Name',
			required: true,
		}),
		templatePath: Property.ShortText({
			displayName: 'Template Path',
			description: 'The theme template to use, without a leading slash.',
			placeholder: '@hubspot/elevate/templates/blank.hubl.html',
			required: true,
		}),
		slug: Property.ShortText({
			displayName: 'Slug',
			placeholder: 'spring-sale',
			required: true,
		}),
		language: Property.ShortText({
			displayName: 'Language',
			description: 'A language code such as en-us or de-de.',
			required: false,
			defaultValue: 'en-us',
		}),
		metaDescription: Property.LongText({
			displayName: 'Meta Description',
			required: false,
			advanced: true,
		}),
		state: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			defaultValue: 'DRAFT',
			display: 'cards',
			options: {
				disabled: false,
				options: [
					{
						label: 'Draft',
						value: 'DRAFT',
						description: 'Kept unpublished',
						icon: 'file',
					},
					{
						label: 'Publish',
						value: 'PUBLISHED_OR_SCHEDULED',
						description: 'Live once created',
						icon: 'send',
					},
				],
			},
		}),
		headHtml: Property.LongText({
			displayName: 'Additional Head HTML',
			required: false,
			advanced: true,
		}),
		footerHtml: Property.LongText({
			displayName: 'Additional Footer HTML',
			required: false,
			advanced: true,
		}),
	},
	async run(context) {
		const url = `https://api.hubapi.com/cms/v3/pages/${
			context.propsValue.pageType === 'site_page' ? 'site-pages' : 'landing-pages'
		}`;
		const {
			pageTitle,
			internalPageName,
			metaDescription,
			templatePath,
			language,
			state,
			headHtml,
			footerHtml,
			slug,
		} = context.propsValue;

		const createdPage = await httpClient.sendRequest<{ id: string }>({
			method: HttpMethod.POST,
			url,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: getHubspotAccessToken(context.auth),
			},
			body: {
				htmlTitle: pageTitle,
				name: internalPageName,
				metaDescription,
				templatePath,
				slug,
				language,
				headHtml,
				footerHtml,
			},
		});

		if (state === 'PUBLISHED_OR_SCHEDULED') {
			await httpClient.sendRequest({
				method: HttpMethod.POST,
				url: `https://api.hubapi.com/content/api/v2/pages/${createdPage.body.id}/publish-action`,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: getHubspotAccessToken(context.auth),
				},
				body: { action: 'schedule-publish' },
			});
		}

		const pageDetails = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: `${url}/${createdPage.body.id}`,
			authentication: { type: AuthenticationType.BEARER_TOKEN, token: getHubspotAccessToken(context.auth) },
		});

		return pageDetails.body;
	},
});
