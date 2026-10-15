import { Store } from '@activepieces/pieces-framework';

import { EmeliaActivity, emeliaApi } from './api';

async function onEnable({ apiKey, campaignId, types, store, isRepublish }: OnEnableParams): Promise<void> {
	if (isRepublish && (await store.get<string[]>(SEEN_IDS_KEY)) !== null) {
		return;
	}
	const now = Date.now();
	const recent = await fetchSince({ apiKey, campaignId, types, sinceMs: now - LOOKBACK_MS });
	await store.put(SEEN_IDS_KEY, recent.map((activity) => activity._id).slice(0, MAX_SEEN_IDS));
	await store.put(LAST_POLL_KEY, now);
}

async function poll({ apiKey, campaignId, types, store }: PollParams): Promise<Record<string, unknown>[]> {
	const now = Date.now();
	const lastPoll = (await store.get<number>(LAST_POLL_KEY)) ?? now;
	const seenIds = (await store.get<string[]>(SEEN_IDS_KEY)) ?? [];
	const seen = new Set(seenIds);
	const recent = await fetchSince({ apiKey, campaignId, types, sinceMs: lastPoll - LOOKBACK_MS });
	const fresh = recent.filter((activity) => !seen.has(activity._id));
	const nextSeen = [...new Set([...recent.map((activity) => activity._id), ...seenIds])].slice(0, MAX_SEEN_IDS);
	await store.put(SEEN_IDS_KEY, nextSeen);
	await store.put(LAST_POLL_KEY, now);
	return [...fresh]
		.sort((a, b) => activityTime(a) - activityTime(b))
		.map((activity) => emeliaApi.flattenActivity({ activity, campaignId }));
}

async function sample({ apiKey, campaignId, types }: SampleParams): Promise<Record<string, unknown>[]> {
	const activities = await emeliaApi.listActivitiesPage({ apiKey, campaignId, page: 0, types });
	return activities.slice(0, SAMPLE_SIZE).map((activity) => emeliaApi.flattenActivity({ activity, campaignId }));
}

async function fetchSince({ apiKey, campaignId, types, sinceMs }: SampleParams & { sinceMs: number }): Promise<EmeliaActivity[]> {
	return await collectPages({ apiKey, campaignId, types, sinceMs, page: 0, collected: [] });
}

async function collectPages({
	apiKey,
	campaignId,
	types,
	sinceMs,
	page,
	collected,
}: SampleParams & { sinceMs: number; page: number; collected: EmeliaActivity[] }): Promise<EmeliaActivity[]> {
	const activities = await emeliaApi.listActivitiesPage({ apiKey, campaignId, page, types });
	const inWindow = activities.filter((activity) => activityTime(activity) >= sinceMs);
	const all = [...collected, ...inWindow];
	const reachedOlder = inWindow.length < activities.length;
	if (activities.length < ACTIVITIES_PAGE_SIZE || reachedOlder || page + 1 >= MAX_PAGES) {
		return all;
	}
	return await collectPages({ apiKey, campaignId, types, sinceMs, page: page + 1, collected: all });
}

function activityTime(activity: EmeliaActivity): number {
	const time = activity.date ? Date.parse(activity.date) : NaN;
	return Number.isNaN(time) ? 0 : time;
}

const SEEN_IDS_KEY = 'emelia_seen_activity_ids';
const LAST_POLL_KEY = 'emelia_last_poll';
const LOOKBACK_MS = 2 * 60 * 60 * 1000;
const ACTIVITIES_PAGE_SIZE = 30;
const MAX_PAGES = 20;
const MAX_SEEN_IDS = 2000;
const SAMPLE_SIZE = 5;
const SAMPLE_ACTIVITY = {
	activity_id: '6650f1a2b839d80011c5e001',
	event: 'MAIL_REPLIED',
	date: '2026-10-08T09:12:00.000Z',
	campaign_id: '6650f1a2b839d80011c5a0f1',
	step: 2,
	ab_version: 0,
	contact_id: '6650f1a2b839d80011c5d001',
	contact_email: 'john.doe@acme.com',
	contact_first_name: 'John',
	contact_last_name: 'Doe',
	contact_phone: null,
	contact_linkedin_url: 'https://www.linkedin.com/in/johndoe',
	contact_company_name: 'Acme',
	reply_subject: 'Re: Quick question, John',
	reply_text: 'Sounds good, call me Tuesday.',
	reply_html: '<p>Sounds good, call me Tuesday.</p>',
	reply_sender_name: 'John Doe',
	sender_email: 'marie.martin@yourcompany.com',
	sender_name: 'Marie Martin',
	event_details: null,
};

export const emeliaActivityPolling = {
	onEnable,
	poll,
	sample,
	SAMPLE_ACTIVITY,
};

type SampleParams = {
	apiKey: string;
	campaignId: string;
	types: string[];
};

type PollParams = SampleParams & {
	store: Store;
};

type OnEnableParams = PollParams & {
	isRepublish: boolean | undefined;
};
