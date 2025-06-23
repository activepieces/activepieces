import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { hubspotAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pageType } from '../common/props';

export const createPageAction = createAction({
	auth: hubspotAuth,
	name: 'create-page',
	displayName: 'Create Page',
	description: 'Creates a new landing/site page.',
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
			description:
				'The path should not include a slash (/) at the start.For example,"@hubspot/elevate/templates/blank.hubl.html".',
			required: true,
		}),
		slug: Property.ShortText({
			displayName: 'Slug',
			required: true,
		}),
		language: Property.ShortText({
			displayName: 'Language',
			required: false,
			defaultValue: 'en-us',
		}),
		metaDescription: Property.LongText({
			displayName: 'Meta Description',
			required: false,
		}),
		state: Property.StaticDropdown({
			displayName: 'State',
			required: false,
			defaultValue: 'DRAFT',
			options: {
				disabled: false,
				options: [
					{
						label: 'Draft',
						value: 'DRAFT',
					},
					{
						label: 'Publish',
						value: 'PUBLISHED_OR_SCHEDULED',
					},
				],
			},
		}),
		headHtml: Property.LongText({
			displayName: 'Additional Head HTML',
			required: false,
		}),
		footerHtml: Property.LongText({
			displayName: 'Additional Footer HTML',
			required: false,
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
				token: context.auth.access_token,
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
					token: context.auth.access_token,
				},
				body: { action: 'schedule-publish' },
			});
		}

		const pageDetails = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: `${url}/${createdPage.body.id}`,
			authentication: { type: AuthenticationType.BEARER_TOKEN, token: context.auth.access_token },
		});

		return pageDetails.body;
	},
});
