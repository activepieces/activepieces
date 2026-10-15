import { HttpMethod } from '@activepieces/pieces-common';

import { facebookLeadsClient } from './client';

import type {
	FacebookLeadsForm,
	FacebookLeadsFormStatus,
	FacebookLeadsLead,
	FacebookLeadsPage,
	FacebookLeadsPaginatedResponse,
	FacebookLeadsUser,
} from './types';

async function getMe({ accessToken }: { accessToken: string }): Promise<FacebookLeadsUser> {
	return await facebookLeadsClient.request<FacebookLeadsUser>({
		method: HttpMethod.GET,
		path: '/me',
		query: { access_token: accessToken, fields: 'id,name' },
	});
}

async function listPages({ accessToken }: { accessToken: string }): Promise<FacebookLeadsPage[]> {
	return await facebookLeadsClient.paginate<FacebookLeadsPage>({
		path: '/me/accounts',
		query: { access_token: accessToken },
	});
}

async function getPageAccessToken({
	pageId,
	accessToken,
}: {
	pageId: string;
	accessToken: string;
}): Promise<string> {
	const response = await facebookLeadsClient.request<{ id: string; access_token?: string }>({
		method: HttpMethod.GET,
		path: `/${pageId}`,
		query: { access_token: accessToken, fields: 'access_token' },
	});
	if (!response.access_token) {
		throw new Error(
			`No Page access token for page ${pageId}. Make sure the connected user manages this Page.`,
		);
	}
	return response.access_token;
}

async function listLeadForms({
	pageId,
	accessToken,
	detailed,
}: {
	pageId: string;
	accessToken: string;
	detailed?: boolean;
}): Promise<FacebookLeadsForm[]> {
	return await facebookLeadsClient.paginate<FacebookLeadsForm>({
		path: `/${pageId}/leadgen_forms`,
		query: { access_token: accessToken, ...(detailed ? { fields: FORM_LIST_FIELDS } : {}) },
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

async function getLeadForm({
	formId,
	accessToken,
}: {
	formId: string;
	accessToken: string;
}): Promise<FacebookLeadsForm> {
	return await facebookLeadsClient.request<FacebookLeadsForm>({
		method: HttpMethod.GET,
		path: `/${formId}`,
		query: { access_token: accessToken, fields: FORM_DETAIL_FIELDS },
	});
}

async function createLeadForm({
	pageId,
	accessToken,
	body,
}: {
	pageId: string;
	accessToken: string;
	body: Record<string, unknown>;
}): Promise<{ id: string }> {
	return await facebookLeadsClient.request<{ id: string }>({
		method: HttpMethod.POST,
		path: `/${pageId}/leadgen_forms`,
		query: { access_token: accessToken },
		body,
	});
}

async function updateLeadFormStatus({
	formId,
	accessToken,
	status,
}: {
	formId: string;
	accessToken: string;
	status: FacebookLeadsFormStatus;
}): Promise<{ success: boolean }> {
	return await facebookLeadsClient.request<{ success: boolean }>({
		method: HttpMethod.POST,
		path: `/${formId}`,
		query: { access_token: accessToken },
		body: { status },
	});
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

async function listFormLeadsPage({
	formId,
	accessToken,
	limit,
	after,
	filtering,
}: {
	formId: string;
	accessToken: string;
	limit?: number;
	after?: string;
	filtering?: string;
}): Promise<FacebookLeadsPaginatedResponse<FacebookLeadsLead>> {
	return await facebookLeadsClient.request<FacebookLeadsPaginatedResponse<FacebookLeadsLead>>({
		method: HttpMethod.GET,
		path: `/${formId}/leads`,
		query: {
			access_token: accessToken,
			fields: LEAD_FIELDS,
			...(limit !== undefined ? { limit: String(limit) } : {}),
			...(after ? { after } : {}),
			...(filtering ? { filtering } : {}),
		},
	});
}

async function listFormLeads({
	formId,
	accessToken,
}: {
	formId: string;
	accessToken: string;
}): Promise<FacebookLeadsLead[]> {
	const response = await listFormLeadsPage({ formId, accessToken });
	return response.data;
}

export const facebookLeadsApi = {
	getMe,
	listPages,
	getPageAccessToken,
	listLeadForms,
	getPageForms,
	getLeadForm,
	createLeadForm,
	updateLeadFormStatus,
	subscribePageToApp,
	getLead,
	listFormLeadsPage,
	listFormLeads,
};

const LEAD_FIELDS =
	'field_data,created_time,ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,form_id,platform';

const FORM_LIST_FIELDS = 'id,name,status,locale,created_time,leads_count';

const FORM_DETAIL_FIELDS =
	'id,name,status,locale,created_time,leads_count,expired_leads_count,questions,privacy_policy_url,follow_up_action_url,page';
