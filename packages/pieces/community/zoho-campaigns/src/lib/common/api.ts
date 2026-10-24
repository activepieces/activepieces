import { HttpMethod } from '@activepieces/pieces-common';

import { zohoCampaignsClient } from './client';

import type {
	ZohoCampaignsAuthValue,
	ZohoCampaignsCampaign,
	ZohoCampaignsCampaignStatus,
	ZohoCampaignsContact,
	ZohoCampaignsContactStatus,
	ZohoCampaignsCreateCampaignResponse,
	ZohoCampaignsListCampaignsResponse,
	ZohoCampaignsListContactsResponse,
	ZohoCampaignsListMailingListsResponse,
	ZohoCampaignsListTagsResponse,
	ZohoCampaignsListTopicsResponse,
	ZohoCampaignsMailingList,
	ZohoCampaignsSort,
	ZohoCampaignsTag,
	ZohoCampaignsTopic,
} from './types';

async function createCampaign({
	auth,
	list_details: listKeys,
	topicId,
	...restParams
}: CreateCampaignParams & {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsCreateCampaignResponse> {
	const list_details = JSON.stringify(
		listKeys.reduce<Record<string, never[]>>((acc, curr) => {
			acc[curr] = [];
			return acc;
		}, {}),
	);
	const body = new URLSearchParams({
		resfmt: 'json',
		list_details,
		...restParams,
		...(topicId && { topicId }),
	}).toString();
	return await zohoCampaignsClient.request<ZohoCampaignsCreateCampaignResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/createCampaign',
		headers: FORM_HEADERS,
		body,
	});
}

async function createTag({
	auth,
	tagName,
}: {
	auth: ZohoCampaignsAuthValue;
	tagName: string;
}): Promise<unknown> {
	return await zohoCampaignsClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: '/tag/add',
		query: { ...BASE_PARAMS, tagName },
	});
}

async function cloneCampaign({
	auth,
	campaignkey,
	campaignname,
	subject,
	from_name,
	from_add,
	reply_to,
	encode_type,
}: CloneCampaignParams & { auth: ZohoCampaignsAuthValue }): Promise<unknown> {
	const campaigninfo = {
		oldcampaignkey: campaignkey,
		...(campaignname && { campaignname }),
		...(subject && { subject }),
		...(from_name && { from_name }),
		...(from_add && { from_add }),
		...(reply_to && { reply_to }),
		...(encode_type && { encode_type }),
	};
	return await zohoCampaignsClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: '/json/clonecampaign',
		query: { ...BASE_PARAMS, campaigninfo: JSON.stringify(campaigninfo) },
	});
}

async function sendCampaign({
	auth,
	campaignkey,
}: {
	auth: ZohoCampaignsAuthValue;
	campaignkey: string;
}): Promise<unknown> {
	return await zohoCampaignsClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: '/sendcampaign',
		headers: FORM_HEADERS,
		query: { ...BASE_PARAMS, campaignkey },
	});
}

async function addUpdateContact({
	auth,
	listkey,
	contactinfo,
	source,
	topic_id,
}: AddUpdateContactParams & { auth: ZohoCampaignsAuthValue }): Promise<unknown> {
	const body = new URLSearchParams({
		...BASE_PARAMS,
		listkey,
		...(source && { source }),
		...(topic_id && { topic_id }),
		contactinfo: JSON.stringify(contactinfo),
	}).toString();
	return await zohoCampaignsClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: '/json/listsubscribe',
		headers: FORM_HEADERS,
		body,
	});
}

async function addTagToContact({
	auth,
	tagName,
	lead_email,
}: TagContactParams & { auth: ZohoCampaignsAuthValue }): Promise<unknown> {
	return await zohoCampaignsClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: '/tag/associate',
		query: { ...BASE_PARAMS, tagName, lead_email },
	});
}

async function removeTag({
	auth,
	tagName,
	lead_email,
}: TagContactParams & { auth: ZohoCampaignsAuthValue }): Promise<unknown> {
	return await zohoCampaignsClient.request<unknown>({
		auth,
		method: HttpMethod.GET,
		path: '/tag/deassociate',
		query: { ...BASE_PARAMS, tagName, lead_email },
	});
}

async function unsubscribeContact({
	auth,
	listkey,
	contactinfo,
	topic_id,
}: UnsubscribeContactParams & {
	auth: ZohoCampaignsAuthValue;
}): Promise<unknown> {
	const body = new URLSearchParams({
		...BASE_PARAMS,
		listkey,
		...(topic_id && { topic_id }),
		contactinfo: JSON.stringify(contactinfo),
	}).toString();
	return await zohoCampaignsClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: '/json/listunsubscribe',
		headers: FORM_HEADERS,
		body,
	});
}

async function addContactsToMailingList({
	auth,
	listkey,
	emailids,
}: {
	auth: ZohoCampaignsAuthValue;
	listkey: string;
	emailids: string;
}): Promise<unknown> {
	return await zohoCampaignsClient.request<unknown>({
		auth,
		method: HttpMethod.POST,
		path: '/addlistsubscribersinbulk',
		query: { ...BASE_PARAMS, listkey, emailids },
	});
}

async function listContacts({
	auth,
	listkey,
	sort,
	status,
	fromindex,
	range,
}: ListContactsParams & {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsContact[]> {
	const response = await zohoCampaignsClient.request<ZohoCampaignsListContactsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/getlistsubscribers',
		query: {
			...BASE_PARAMS,
			listkey,
			...pagingQuery({ fromindex, range }),
			...(sort && { sort }),
			...(status && { status }),
		},
	});
	return response.list_of_details || [];
}

async function listCampaigns({
	auth,
	sort,
	status,
	fromindex,
	range,
}: ListCampaignsParams & {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsCampaign[]> {
	const response = await zohoCampaignsClient.request<ZohoCampaignsListCampaignsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/recentcampaigns',
		query: {
			...BASE_PARAMS,
			...pagingQuery({ fromindex, range }),
			...(sort && { sort }),
			...(status && { status }),
		},
	});
	return response.recent_campaigns || [];
}

async function listMailingLists({
	auth,
	sort,
	fromindex,
	range,
}: ListMailingListsParams & {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsMailingList[]> {
	const response = await zohoCampaignsClient.request<ZohoCampaignsListMailingListsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/getmailinglists',
		query: {
			...BASE_PARAMS,
			...pagingQuery({ fromindex, range }),
			...(sort && { sort }),
		},
	});
	return response.list_of_details || [];
}

async function listTopics({
	auth,
}: {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsTopic[]> {
	const response = await zohoCampaignsClient.request<ZohoCampaignsListTopicsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/topics',
		query: { ...BASE_PARAMS },
	});
	return response.topicDetails;
}

async function listTags({
	auth,
}: {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsTag[] | undefined> {
	const response = await zohoCampaignsClient.request<ZohoCampaignsListTagsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/tag/getalltags',
		query: { ...BASE_PARAMS },
	});
	return response.tags;
}

function pagingQuery({
	fromindex,
	range,
}: {
	fromindex?: number;
	range?: number;
}): Record<string, string> {
	return {
		...(fromindex && { fromindex: String(fromindex) }),
		...(range && { range: String(range) }),
	};
}

export const zohoCampaignsApi = {
	createCampaign,
	createTag,
	cloneCampaign,
	sendCampaign,
	addUpdateContact,
	addTagToContact,
	removeTag,
	unsubscribeContact,
	addContactsToMailingList,
	listContacts,
	listCampaigns,
	listMailingLists,
	listTopics,
	listTags,
};

const BASE_PARAMS = { resfmt: 'JSON' };

const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' };

type CreateCampaignParams = {
	campaignname: string;
	from_email: string;
	subject: string;
	content_url?: string;
	list_details: string[];
	topicId?: string;
};

type CloneCampaignParams = {
	campaignkey: string;
	campaignname?: string;
	subject?: string;
	from_name?: string;
	from_add?: string;
	reply_to?: string;
	encode_type?: string;
};

type AddUpdateContactParams = {
	listkey: string;
	contactinfo: Record<string, unknown>;
	source?: string;
	topic_id?: string;
};

type TagContactParams = {
	tagName: string;
	lead_email: string;
};

type UnsubscribeContactParams = {
	listkey: string;
	contactinfo: Record<string, unknown>;
	topic_id?: string;
};

type ListContactsParams = {
	listkey: string;
	sort?: ZohoCampaignsSort;
	status?: ZohoCampaignsContactStatus;
	fromindex?: number;
	range?: number;
};

type ListCampaignsParams = {
	sort?: ZohoCampaignsSort;
	status?: ZohoCampaignsCampaignStatus;
	fromindex?: number;
	range?: number;
};

type ListMailingListsParams = {
	sort?: ZohoCampaignsSort;
	fromindex?: number;
	range?: number;
};
