import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { hubspotAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';

export const createLandingPageAction = createAction({
	auth: hubspotAuth,
	name: 'create-landing-page',
	displayName: 'Create Landing Page',
	description: 'Creates a new landing page.',
	props: {
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

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://api.hubapi.com/cms/v3/pages/landing-pages',
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
				state,
				headHtml,
				footerHtml,
			},
		});

		return response.body;
	},
});
