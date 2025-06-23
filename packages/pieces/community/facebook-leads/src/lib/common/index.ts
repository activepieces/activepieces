import { DropdownOption, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpRequest, HttpMethod, httpClient } from '@activepieces/pieces-common';
import {
	FacebookForm,
	FacebookLead,
	FacebookPage,
	FacebookPageDropdown,
	FacebookPaginatedResponse,
} from './types';

export const facebookLeadsCommon = {
	baseUrl: 'https://graph.facebook.com',
	page: Property.Dropdown({
		displayName: 'Page',
		required: true,
		refreshers: [],
		options: async ({ auth }) => {
			if (!auth) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Connect your account first.',
				};
			}

			try {
				const authValue = auth as OAuth2PropertyValue;

				const options: DropdownOption<FacebookPageDropdown>[] = [];

				let nextUrl: string | null = `${facebookLeadsCommon.baseUrl}/me/accounts`;

				do {
					const response = await httpClient.sendRequest({
						method: HttpMethod.GET,
						url: nextUrl,
						queryParams: {
							access_token: authValue.access_token,
						},
					});

					const { data, paging } = response.body as FacebookPaginatedResponse<FacebookPage>;

					const items = data ?? [];
					for (const page of items) {
						options.push({
							label: page.name,
							value: {
								id: page.id,
								accessToken: page.access_token,
							},
						});
					}

					nextUrl = paging?.next ?? null;
				} while (nextUrl);

				return {
					disabled: false,
					options,
				};
			} catch (e) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Error occured while fetching pages.',
				};
			}
		},
	}),
	form: Property.Dropdown({
		displayName: 'Form',
		required: false,
		refreshers: ['page'],
		options: async ({ page }) => {
			if (!page) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Select page first.',
				};
			}

			try {
				const pageDeatils = page as {
					id: string;
					accessToken: string;
				};

				const options: DropdownOption<string>[] = [
					{
						label: 'All Forms (Default)',
						value: 'all',
					},
				];

				let nextUrl:
					| string
					| null = `${facebookLeadsCommon.baseUrl}/${pageDeatils.id}/leadgen_forms`;

				do {
					const response = await httpClient.sendRequest({
						method: HttpMethod.GET,
						url: nextUrl,
						queryParams: {
							access_token: pageDeatils.accessToken,
						},
					});

					const { data, paging } = response.body as FacebookPaginatedResponse<FacebookForm>;

					const items = data ?? [];
					for (const form of items) {
						options.push({
							label: form.name,
							value: form.id,
						});
					}

					nextUrl = paging?.next ?? null;
				} while (nextUrl);

				return {
					disabled: false,
					options,
				};
			} catch (e) {
				return {
					disabled: true,
					options: [],
					placeholder: 'Error occured while fetching forms.',
				};
			}
		},
	}),

	subscribePageToApp: async (pageId: any, accessToken: string) => {
		const request: HttpRequest = {
			method: HttpMethod.POST,
			url: `${facebookLeadsCommon.baseUrl}/${pageId}/subscribed_apps`,
			body: {
				access_token: accessToken,
				subscribed_fields: ['leadgen'],
			},
		};

		await httpClient.sendRequest(request);
	},

	getPageForms: async (pageId: string, accessToken: string) => {
		const request: HttpRequest = {
			method: HttpMethod.GET,
			url: `${facebookLeadsCommon.baseUrl}/${pageId}/leadgen_forms`,
			queryParams: {
				access_token: accessToken,
			},
		};

		const response = await httpClient.sendRequest(request);
		return response.body.data;
	},

	getLeadDetails: async (leadId: string, accessToken: string) => {
		const response = await httpClient.sendRequest<FacebookLead>({
			method: HttpMethod.GET,
			url: `${facebookLeadsCommon.baseUrl}/${leadId}`,
			queryParams: {
				access_token: accessToken,
				fields:
					'field_data,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,platform',
			},
		});

		return response.body;
	},

	loadSampleData: async (formId: string, accessToken: string) => {
		const response = await httpClient.sendRequest<FacebookPaginatedResponse<FacebookLead>>({
			method: HttpMethod.GET,
			url: `${facebookLeadsCommon.baseUrl}/${formId}/leads`,
			queryParams: {
				access_token: accessToken,
				fields:
					'field_data,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,platform',
			},
		});

		return response.body;
	},

	transformLeadData: (leadData: FacebookLead) => {
		return {
			lead_id: leadData.id,
			form_id: leadData.form_id,
			platform: leadData.platform,
			ad_id: leadData.ad_id,
			ad_name: leadData.ad_name,
			adset_id: leadData.adset_id,
			adset_name: leadData.adset_name,
			campaign_id: leadData.campaign_id,
			campaign_name: leadData.campaign_name,
			created_time: leadData.created_time,
			data: leadData.field_data.reduce(
				(acc, field) => ({
					...acc,
					[field.name]: field.values && field.values.length > 0 ? field.values[0] : null,
				}),
				{},
			),
		};
	},
};
