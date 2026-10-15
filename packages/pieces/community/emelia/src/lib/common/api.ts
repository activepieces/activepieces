import { HttpMethod } from '@activepieces/pieces-common';

import { emeliaClient } from './client';

async function listCampaigns({ apiKey }: { apiKey: string }): Promise<EmeliaCampaignSummary[]> {
	const body = await emeliaClient.request<{ campaigns?: EmeliaCampaignSummary[] }>({
		apiKey,
		method: HttpMethod.GET,
		path: '/advanced/campaigns',
	});
	return body.campaigns ?? [];
}

async function getCampaign({ apiKey, campaignId }: { apiKey: string; campaignId: string }): Promise<EmeliaCampaign> {
	const body = await emeliaClient.request<{ campaign?: EmeliaCampaign }>({
		apiKey,
		method: HttpMethod.GET,
		path: `/advanced/campaigns/${encodeURIComponent(campaignId)}`,
	});
	if (!body.campaign) {
		throw new Error(`Emelia returned no campaign for id ${campaignId}.`);
	}
	return body.campaign;
}

async function listAllLists({ apiKey }: { apiKey: string }): Promise<EmeliaList[]> {
	return await collectListPages({ apiKey, page: 1, collected: [] });
}

async function collectListPages({
	apiKey,
	page,
	collected,
}: {
	apiKey: string;
	page: number;
	collected: EmeliaList[];
}): Promise<EmeliaList[]> {
	const body = await emeliaClient.request<EmeliaListsPage>({
		apiKey,
		method: HttpMethod.GET,
		path: '/lists/list',
		queryParams: { page: String(page), limit: String(LISTS_PAGE_SIZE) },
	});
	const items = body.items ?? [];
	const all = [...collected, ...items];
	const total = typeof body.total === 'number' ? body.total : all.length;
	if (items.length < LISTS_PAGE_SIZE || all.length >= total || page >= MAX_LIST_PAGES) {
		return all;
	}
	return await collectListPages({ apiKey, page: page + 1, collected: all });
}

async function listActivitiesPage({
	apiKey,
	campaignId,
	page,
	types,
}: {
	apiKey: string;
	campaignId: string;
	page: number;
	types: string[];
}): Promise<EmeliaActivity[]> {
	const body = await emeliaClient.request<{ activities?: EmeliaActivity[] }>({
		apiKey,
		method: HttpMethod.GET,
		path: `/advanced/campaigns/${encodeURIComponent(campaignId)}/activities`,
		queryParams: {
			page: String(page),
			...(types.length > 0 ? { types: types.join(',') } : {}),
		},
	});
	return body.activities ?? [];
}

async function findCampaignContact({
	apiKey,
	campaignId,
	identifier,
}: {
	apiKey: string;
	campaignId: string;
	identifier: string;
}): Promise<EmeliaCampaignContact | undefined> {
	const body = await emeliaClient.request<{ list?: EmeliaCampaignContact[] }>({
		apiKey,
		method: HttpMethod.GET,
		path: '/advanced/campaign/contacts',
		queryParams: { id: campaignId, page: '0', perPage: '100', query: identifier },
	});
	const target = normalizeIdentifier(identifier);
	return (body.list ?? []).find(
		(contact) =>
			normalizeIdentifier(contact.email ?? '') === target ||
			normalizeIdentifier(contact.linkedinUrlProfile ?? '') === target,
	);
}

function normalizeIdentifier(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//, '')
		.replace(/^www\./, '')
		.replace(/\/+$/, '');
}

function flattenCampaign({ campaign }: { campaign: EmeliaCampaign }): Record<string, unknown> {
	const schedule = campaign.schedule ?? {};
	const lists = campaign.recipients?.lists ?? [];
	const identities = campaign.identities ?? [];
	return {
		id: campaign._id,
		name: campaign.name ?? null,
		status: campaign.status ?? null,
		created_at: campaign.createdAt ?? null,
		started_at: campaign.startAt ?? null,
		planned_start: campaign.plannedStart ?? null,
		estimated_end: campaign.estimatedEnd ?? null,
		time_zone: emeliaClient.readString({ source: schedule, key: 'timeZone' }),
		sending_window_start: emeliaClient.readString({ source: schedule, key: 'start' }),
		sending_window_end: emeliaClient.readString({ source: schedule, key: 'end' }),
		daily_new_email_contacts: numberOrNull(schedule['dailyEmailAdded']),
		daily_email_limit: numberOrNull(schedule['dailyEmailLimit']),
		daily_new_linkedin_contacts: numberOrNull(schedule['dailyLinkedinAdded']),
		track_opens: booleanOrNull(schedule['trackOpens']),
		track_links: booleanOrNull(schedule['trackLinks']),
		list_ids: lists.map((list) => list._id).join(', '),
		list_names: lists.map((list) => list.name).join(', '),
		total_contacts: lists.reduce((sum, list) => sum + (typeof list.contactCount === 'number' ? list.contactCount : 0), 0),
		sender_names: identities
			.map((identity) => emeliaClient.readString({ source: identity, key: 'name' }))
			.filter((name): name is string => name !== null)
			.join(', '),
	};
}

function flattenActivity({ activity, campaignId }: { activity: EmeliaActivity; campaignId: string }): Record<string, unknown> {
	const contact = activity.contact ?? {};
	const reply = activity.reply ?? {};
	const sender = activity.sender;
	return {
		activity_id: activity._id,
		event: activity.event ?? null,
		date: activity.date ?? null,
		campaign_id: campaignId,
		step: numberOrNull(activity.step),
		ab_version: numberOrNull(activity.version),
		contact_id: emeliaClient.readString({ source: contact, key: '_id' }),
		contact_email: emeliaClient.readString({ source: contact, key: 'email' }),
		contact_first_name: emeliaClient.readString({ source: contact, key: 'firstName' }),
		contact_last_name: emeliaClient.readString({ source: contact, key: 'lastName' }),
		contact_phone: emeliaClient.readString({ source: contact, key: 'phone' }),
		contact_linkedin_url: emeliaClient.readString({ source: contact, key: 'linkedinUrlProfile' }),
		contact_company_name: emeliaClient.readString({ source: contact, key: 'companyName' }),
		reply_subject: emeliaClient.readString({ source: reply, key: 'subject' }),
		reply_text: emeliaClient.readString({ source: reply, key: 'text' }),
		reply_html: emeliaClient.readString({ source: reply, key: 'content' }),
		reply_sender_name: emeliaClient.readString({ source: reply, key: 'senderName' }),
		sender_email: typeof sender === 'string' ? sender : emeliaClient.readString({ source: sender, key: 'email' }),
		sender_name: emeliaClient.readString({ source: sender, key: 'name' }),
		event_details: activity.customData && Object.keys(activity.customData).length > 0 ? JSON.stringify(activity.customData) : null,
	};
}

function flattenListContact({ contact }: { contact: EmeliaListContact }): Record<string, unknown> {
	const company = contact.company ?? {};
	return {
		id: contact.id,
		first_name: contact.firstName ?? null,
		last_name: contact.lastName ?? null,
		full_name: contact.fullName ?? null,
		email: contact.email ?? null,
		email_verification: contact.emailVerified ?? null,
		phone: contact.phone ?? null,
		mobile_phone: contact.mobilePhone ?? null,
		linkedin_url: contact.linkedinUrlProfile ?? null,
		job_title: contact.jobTitle ?? null,
		city: contact.city ?? null,
		country: contact.country ?? null,
		status: contact.status ? contact.status : null,
		company_name: emeliaClient.readString({ source: company, key: 'name' }),
		company_domain: emeliaClient.readString({ source: company, key: 'domain' }),
		created_at: contact.createdAt ? contact.createdAt : null,
		updated_at: contact.updatedAt ? contact.updatedAt : null,
	};
}

function numberOrNull(value: unknown): number | null {
	return typeof value === 'number' ? value : null;
}

function booleanOrNull(value: unknown): boolean | null {
	return typeof value === 'boolean' ? value : null;
}

const LISTS_PAGE_SIZE = 100;
const MAX_LIST_PAGES = 20;

export const emeliaApi = {
	listCampaigns,
	getCampaign,
	listAllLists,
	listActivitiesPage,
	findCampaignContact,
	flattenCampaign,
	flattenActivity,
	flattenListContact,
};

export type EmeliaCampaignSummary = {
	_id: string;
	name: string;
	status?: string;
};

export type EmeliaCampaign = {
	_id: string;
	name?: string;
	status?: string;
	createdAt?: string;
	startAt?: string;
	plannedStart?: string;
	estimatedEnd?: string;
	schedule?: Record<string, unknown>;
	identities?: Record<string, unknown>[];
	recipients?: {
		lists?: { _id: string; name: string; contactCount?: number }[];
	};
};

export type EmeliaList = {
	_id: string;
	name: string;
	numberOfContacts?: number;
};

export type EmeliaActivity = {
	_id: string;
	event?: string;
	date?: string;
	step?: number;
	version?: number;
	contact?: Record<string, unknown>;
	reply?: Record<string, unknown>;
	sender?: unknown;
	customData?: Record<string, unknown>;
};

export type EmeliaCampaignContact = {
	_id: string;
	email?: string;
	firstName?: string;
	lastName?: string;
	linkedinUrlProfile?: string;
	status?: string;
};

export type EmeliaListContact = {
	id: string;
	firstName?: string;
	lastName?: string;
	fullName?: string;
	email?: string | null;
	emailVerified?: string;
	phone?: string | null;
	mobilePhone?: string | null;
	linkedinUrlProfile?: string | null;
	jobTitle?: string;
	city?: string;
	country?: string;
	status?: string;
	company?: Record<string, unknown> | null;
	createdAt?: string;
	updatedAt?: string;
};

type EmeliaListsPage = {
	items?: EmeliaList[];
	total?: number;
};
