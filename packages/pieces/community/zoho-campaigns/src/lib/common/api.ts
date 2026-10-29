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
	ZohoCampaignsListSentCampaignsResponse,
	ZohoCampaignsListTagsResponse,
	ZohoCampaignsListTopicsResponse,
	ZohoCampaignsMailingList,
	ZohoCampaignsRecipientAction,
	ZohoCampaignsResponse,
	ZohoCampaignsSignupForm,
	ZohoCampaignsSort,
	ZohoCampaignsTag,
	ZohoCampaignsTopic,
} from './types';

async function createCampaign({
	auth,
	list_details: listKeys,
	topicId,
	segments,
	...restParams
}: CreateCampaignParams & {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsCreateCampaignResponse> {
	const list_details = listKeys
		? JSON.stringify(
				listKeys.reduce<Record<string, never[]>>((acc, curr) => {
					acc[curr] = [];
					return acc;
				}, {}),
		  )
		: undefined;
	const body = new URLSearchParams({
		resfmt: 'json',
		...(list_details && { list_details }),
		...restParams,
		...(topicId && { topicId }),
		...(segments && { segments: `[${segments.join(',')}]` }),
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
	tagDesc,
	color,
}: {
	auth: ZohoCampaignsAuthValue;
	tagName: string;
	tagDesc?: string;
	color?: string;
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/tag/add',
		query: { ...BASE_PARAMS, tagName, ...(tagDesc && { tagDesc }), ...(color && { color }) },
	});
}

async function ensureTag({
	auth,
	tagName,
}: {
	auth: ZohoCampaignsAuthValue;
	tagName: string;
}): Promise<{ created: boolean }> {
	const tags = await listTags({ auth });
	const tagExists =
		tags !== undefined &&
		tags.some((tagMap) => Object.values(tagMap).some((t) => t.tag_name === tagName));
	if (tagExists) {
		return { created: false };
	}
	const response = await createTag({ auth, tagName });
	return { created: response.status === 'success' };
}

async function deleteTag({
	auth,
	tagName,
}: {
	auth: ZohoCampaignsAuthValue;
	tagName: string;
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/tag/delete',
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
}: CloneCampaignParams & { auth: ZohoCampaignsAuthValue }): Promise<ZohoCampaignsResponse> {
	const campaigninfo = {
		oldcampaignkey: campaignkey,
		...(campaignname && { campaignname }),
		...(subject && { subject }),
		...(from_name && { from_name }),
		...(from_add && { from_add }),
		...(reply_to && { reply_to }),
		...(encode_type && { encode_type }),
	};
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
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
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
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
}: AddUpdateContactParams & { auth: ZohoCampaignsAuthValue }): Promise<ZohoCampaignsResponse> {
	const body = new URLSearchParams({
		...BASE_PARAMS,
		listkey,
		...(source && { source }),
		...(topic_id && { topic_id }),
		contactinfo: JSON.stringify(contactinfo),
	}).toString();
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
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
}: TagContactParams & { auth: ZohoCampaignsAuthValue }): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
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
}: TagContactParams & { auth: ZohoCampaignsAuthValue }): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
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
}): Promise<ZohoCampaignsResponse> {
	const body = new URLSearchParams({
		...BASE_PARAMS,
		listkey,
		...(topic_id && { topic_id }),
		contactinfo: JSON.stringify(contactinfo),
	}).toString();
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
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
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/addlistsubscribersinbulk',
		query: { ...BASE_PARAMS, listkey, emailids },
	});
}

async function listContacts(
	params: ListContactsParams & { auth: ZohoCampaignsAuthValue },
): Promise<ZohoCampaignsContact[]> {
	const response = await getListSubscribers(params);
	return response.list_of_details || [];
}

async function getListSubscribers({
	auth,
	listkey,
	sort,
	status,
	fromindex,
	range,
}: ListContactsParams & {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsListContactsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsListContactsResponse>({
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
}

async function listCampaigns(
	params: ListCampaignsParams & { auth: ZohoCampaignsAuthValue },
): Promise<ZohoCampaignsCampaign[]> {
	const response = await getRecentCampaigns(params);
	return response.recent_campaigns || [];
}

async function getRecentCampaigns({
	auth,
	sort,
	status,
	fromindex,
	range,
}: ListCampaignsParams & {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsListCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsListCampaignsResponse>({
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
}

async function listMailingLists(
	params: ListMailingListsParams & { auth: ZohoCampaignsAuthValue },
): Promise<ZohoCampaignsMailingList[]> {
	const response = await getMailingLists(params);
	return response.list_of_details || [];
}

async function getMailingLists({
	auth,
	sort,
	fromindex,
	range,
}: ListMailingListsParams & {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsListMailingListsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsListMailingListsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/getmailinglists',
		query: {
			...BASE_PARAMS,
			...pagingQuery({ fromindex, range }),
			...(sort && { sort }),
		},
	});
}

async function getMailingListDetails({
	auth,
	listkey,
	filtertype,
	fromindex,
	range,
}: {
	auth: ZohoCampaignsAuthValue;
	listkey: string;
	filtertype?: 'sentcampaigns' | 'scheduledcampaigns' | 'recentcampaigns';
	fromindex?: number;
	range?: number;
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/getlistadvanceddetails',
		query: {
			...BASE_PARAMS,
			listkey,
			...(filtertype && { filtertype }),
			...pagingQuery({ fromindex, range }),
		},
	});
}

async function listContactFields({
	auth,
}: {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/contact/allfields',
		query: { type: 'json' },
	});
}

async function updateMailingList({
	auth,
	listkey,
	newlistname,
	signupform,
}: {
	auth: ZohoCampaignsAuthValue;
	listkey: string;
	newlistname: string;
	signupform: ZohoCampaignsSignupForm;
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/updatelistdetails',
		query: { ...BASE_PARAMS, listkey, newlistname, signupform },
	});
}

async function deleteMailingList({
	auth,
	listkey,
	deletecontacts,
}: {
	auth: ZohoCampaignsAuthValue;
	listkey: string;
	deletecontacts?: 'on' | 'off';
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/deletemailinglist',
		query: { ...BASE_PARAMS, listkey, ...(deletecontacts && { deletecontacts }) },
	});
}

async function countContacts({
	auth,
	listkey,
	status,
}: {
	auth: ZohoCampaignsAuthValue;
	listkey: string;
	status?: 'active' | 'unsub' | 'bounce' | 'spam';
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/listsubscriberscount',
		query: { ...BASE_PARAMS, listkey, ...(status && { status }) },
	});
}

async function addContactToDoNotMail({
	auth,
	contactinfo,
}: {
	auth: ZohoCampaignsAuthValue;
	contactinfo: Record<string, unknown>;
}): Promise<ZohoCampaignsResponse> {
	const body = new URLSearchParams({
		...BASE_PARAMS,
		contactinfo: JSON.stringify(contactinfo),
	}).toString();
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/json/contactdonotmail',
		headers: FORM_HEADERS,
		body,
	});
}

async function createMailingList({
	auth,
	listname,
	signupform,
	listdescription,
	emailids,
}: {
	auth: ZohoCampaignsAuthValue;
	listname: string;
	signupform: ZohoCampaignsSignupForm;
	listdescription?: string;
	emailids: string;
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/addlistandcontacts',
		headers: FORM_HEADERS,
		query: {
			...BASE_PARAMS,
			listname,
			signupform,
			mode: 'newlist',
			emailids,
			...(listdescription && { listdescription }),
		},
	});
}

async function createCustomField({
	auth,
	fieldname,
	fieldtype,
	fieldlength,
}: {
	auth: ZohoCampaignsAuthValue;
	fieldname: string;
	fieldtype: string;
	fieldlength?: number;
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/custom/add',
		headers: FORM_HEADERS,
		query: {
			type: 'json',
			fieldname,
			fieldtype,
			...(fieldlength !== undefined && { fieldlength: String(fieldlength) }),
		},
	});
}

async function listTopics({
	auth,
}: {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsTopic[]> {
	const response = await getTopics({ auth });
	return response.topicDetails;
}

async function getTopics({
	auth,
	fromIndex,
	range,
}: TopicPagingParams & { auth: ZohoCampaignsAuthValue }): Promise<ZohoCampaignsListTopicsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsListTopicsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/topics',
		query: { ...BASE_PARAMS, ...topicPagingQuery({ fromIndex, range }) },
	});
}

async function createTopic({
	auth,
	topicName,
	topicDesc,
}: {
	auth: ZohoCampaignsAuthValue;
	topicName: string;
	topicDesc: string;
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/topics',
		query: {
			...BASE_PARAMS,
			details: JSON.stringify({
				topic_name: topicName,
				topic_desc: topicDesc,
			}),
		},
	});
}

async function listTags({
	auth,
}: {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsTag[] | undefined> {
	const response = await getAllTags({ auth });
	return response.tags;
}

async function getAllTags({
	auth,
}: {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsListTagsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsListTagsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/tag/getalltags',
		query: { ...BASE_PARAMS },
	});
}

function topicPagingQuery({ fromIndex, range }: TopicPagingParams): Record<string, string> {
	if (fromIndex === undefined && range === undefined) {
		return {};
	}
	return {
		details: JSON.stringify({
			...(fromIndex !== undefined && { from_index: fromIndex }),
			...(range !== undefined && { range }),
		}),
	};
}

async function getCampaignDetails({
	auth,
	campaignkey,
	campaigntype,
}: {
	auth: ZohoCampaignsAuthValue;
	campaignkey: string;
	campaigntype?: 'normal' | 'abtesting';
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/getcampaigndetails',
		query: { ...BASE_PARAMS, campaignkey, ...(campaigntype && { campaigntype }) },
	});
}

async function scheduleCampaign({
	auth,
	campaignkey,
	scheduleDate,
	scheduleHour,
	scheduleMinute,
	amPm,
	isTimeWarp,
	sendingTZ,
}: ScheduleCampaignParams & { auth: ZohoCampaignsAuthValue }): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/sendcampaign',
		headers: FORM_HEADERS,
		query: {
			...BASE_PARAMS,
			isschedule: 'true',
			campaignkey,
			scheduleDate,
			scheduleHour,
			scheduleMinute,
			am_pm: amPm,
			...(isTimeWarp !== undefined && { istimewarp: String(isTimeWarp) }),
			...(sendingTZ && { sendingTZ }),
		},
	});
}

async function getCampaignReport({
	auth,
	campaignkey,
}: {
	auth: ZohoCampaignsAuthValue;
	campaignkey: string;
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/campaignreports',
		query: { ...BASE_PARAMS, campaignkey },
	});
}

async function listSentCampaigns({
	auth,
	limit,
}: {
	auth: ZohoCampaignsAuthValue;
	limit: number;
}): Promise<ZohoCampaignsListSentCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsListSentCampaignsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/recentsentcampaigns',
		query: { ...BASE_PARAMS, limit: String(limit) },
	});
}

async function getLastCampaignReport({
	auth,
}: {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/getlastcampaignreport',
		headers: FORM_HEADERS,
		query: { ...BASE_PARAMS },
	});
}

async function listCampaignRecipients({
	auth,
	campaignkey,
	action,
	fromindex,
	range,
}: ListCampaignRecipientsParams & {
	auth: ZohoCampaignsAuthValue;
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.POST,
		path: '/getcampaignrecipientsdata',
		headers: FORM_HEADERS,
		query: { ...BASE_PARAMS, campaignkey, action, ...pagingQuery({ fromindex, range }) },
	});
}

async function deleteCampaign({
	auth,
	campaignkey,
}: {
	auth: ZohoCampaignsAuthValue;
	campaignkey: string;
}): Promise<ZohoCampaignsResponse> {
	return await zohoCampaignsClient.request<ZohoCampaignsResponse>({
		auth,
		method: HttpMethod.GET,
		path: '/deletecampaign',
		query: { ...BASE_PARAMS, campaignkey },
	});
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
	getRecentCampaigns,
	getCampaignDetails,
	scheduleCampaign,
	getCampaignReport,
	listSentCampaigns,
	getLastCampaignReport,
	listCampaignRecipients,
	deleteCampaign,
	listMailingLists,
	getListSubscribers,
	getMailingLists,
	getMailingListDetails,
	listContactFields,
	updateMailingList,
	deleteMailingList,
	countContacts,
	addContactToDoNotMail,
	createMailingList,
	createCustomField,
	listTopics,
	getTopics,
	createTopic,
	listTags,
	getAllTags,
	ensureTag,
	deleteTag,
};

const BASE_PARAMS = { resfmt: 'JSON' };

const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded' };

type CreateCampaignParams = {
	campaignname: string;
	from_email: string;
	subject: string;
	from_name?: string;
	content_url?: string;
	list_details?: string[];
	segments?: string[];
	topicId?: string;
};

type ScheduleCampaignParams = {
	campaignkey: string;
	scheduleDate: string;
	scheduleHour: string;
	scheduleMinute: string;
	amPm: 'AM' | 'PM';
	isTimeWarp?: boolean;
	sendingTZ?: string;
};

type ListCampaignRecipientsParams = {
	campaignkey: string;
	action: ZohoCampaignsRecipientAction;
	fromindex?: number;
	range?: number;
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

type TopicPagingParams = {
	fromIndex?: number;
	range?: number;
};

type ListMailingListsParams = {
	sort?: ZohoCampaignsSort;
	fromindex?: number;
	range?: number;
};
