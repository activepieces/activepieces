import { HttpMethod } from '@activepieces/pieces-common';

import { facebookLeadsClient } from './client';

import type {
	FacebookLeadsForm,
	FacebookLeadsLead,
	FacebookLeadsPage,
	FacebookLeadsPaginatedResponse,
} from './types';

async function listPages({ accessToken }: { accessToken: string }): Promise<FacebookLeadsPage[]> {
	return await facebookLeadsClient.paginate<FacebookLeadsPage>({
		path: '/me/accounts',
		query: { access_token: accessToken },
	});
}

async function listLeadForms({
	pageId,
	accessToken,
}: {
	pageId: string;
	accessToken: string;
}): Promise<FacebookLeadsForm[]> {
	return await facebookLeadsClient.paginate<FacebookLeadsForm>({
		path: `/${pageId}/leadgen_forms`,
		query: { access_token: accessToken },
	});
}

async function getPageForms({
	pageId,
	accessToken,
}: {
	pageId: string;
	accessToken: string;
}): Promise<FacebookLeadsForm[]> {
	const response = await facebookLeadsClient.request<
		FacebookLeadsPaginatedResponse<FacebookLeadsForm>
	>({
		method: HttpMethod.GET,
		path: `/${pageId}/leadgen_forms`,
		query: { access_token: accessToken },
	});
	return response.data;
}

async function subscribePageToApp({
	pageId,
	accessToken,
}: {
	pageId: string;
	accessToken: string;
}): Promise<void> {
	await facebookLeadsClient.request<unknown>({
		method: HttpMethod.POST,
		path: `/${pageId}/subscribed_apps`,
		body: {
			access_token: accessToken,
			subscribed_fields: ['leadgen'],
		},
	});
}

async function getLead({
	leadId,
	accessToken,
}: {
	leadId: string;
	accessToken: string;
}): Promise<FacebookLeadsLead> {
	return await facebookLeadsClient.request<FacebookLeadsLead>({
		method: HttpMethod.GET,
		path: `/${leadId}`,
		query: { access_token: accessToken, fields: LEAD_FIELDS },
	});
}

async function listFormLeads({
	formId,
	accessToken,
}: {
	formId: string;
	accessToken: string;
}): Promise<FacebookLeadsLead[]> {
	const response = await facebookLeadsClient.request<
		FacebookLeadsPaginatedResponse<FacebookLeadsLead>
	>({
		method: HttpMethod.GET,
		path: `/${formId}/leads`,
		query: { access_token: accessToken, fields: LEAD_FIELDS },
	});
	return response.data;
}

export const facebookLeadsApi = {
	listPages,
	listLeadForms,
	getPageForms,
	subscribePageToApp,
	getLead,
	listFormLeads,
};

const LEAD_FIELDS =
	'field_data,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,platform';
