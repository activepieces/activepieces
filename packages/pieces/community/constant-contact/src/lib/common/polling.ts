import { Store } from '@activepieces/pieces-framework';
import { CONTACT_INCLUDE, ConstantContactListCapError, ccClient } from './client';
import { UnknownRecord, ccData } from './types';

function readState(raw: unknown): PollState | undefined {
	const scannedThrough = ccData.textAt({ value: raw, key: 'scanned_through' });
	if (scannedThrough === undefined || Number.isNaN(Date.parse(scannedThrough))) {
		return undefined;
	}
	return { scanned_through: scannedThrough, recent: ccData.stringsAt({ value: raw, key: 'recent' }) };
}

function eventTime({ contact, config }: { contact: UnknownRecord; config: ContactPollConfig }): string {
	const holder = config.timestampField === 'opt_out_date' ? ccData.recordAt({ value: contact, key: 'email_address' }) : contact;
	return ccData.textAt({ value: holder, key: config.timestampField }) ?? '';
}

function eventKey({ contact, config }: { contact: UnknownRecord; config: ContactPollConfig }): string {
	return `${ccData.textAt({ value: contact, key: 'contact_id' }) ?? ''}|${eventTime({ contact, config })}`;
}

function epochOf(text: string): number {
	const parsed = Date.parse(text);
	return Number.isNaN(parsed) ? 0 : parsed;
}

async function onEnable({ store, isRepublish, config, now = Date.now }: { store: Store; isRepublish: boolean | undefined; config: ContactPollConfig; now?: () => number }): Promise<void> {
	if (isRepublish === true && readState(await store.get<unknown>(config.storeKey)) !== undefined) {
		return;
	}
	await store.put<PollState>(config.storeKey, { scanned_through: new Date(now()).toISOString(), recent: [] });
}

async function onDisable({ store, config }: { store: Store; config: ContactPollConfig }): Promise<void> {
	await store.delete(config.storeKey);
}

async function poll({
	accessToken,
	store,
	config,
	now = Date.now,
	maxItems = MAX_ITEMS_PER_POLL,
}: {
	accessToken: string;
	store: Store;
	config: ContactPollConfig;
	now?: () => number;
	maxItems?: number;
}): Promise<UnknownRecord[]> {
	const pollStart = now();
	const state = readState(await store.get<unknown>(config.storeKey));
	if (state === undefined) {
		await store.put<PollState>(config.storeKey, { scanned_through: new Date(pollStart).toISOString(), recent: [] });
		return [];
	}
	const { contacts, end } = await fetchWindow({ accessToken, config, scannedThrough: epochOf(state.scanned_through), pollStart, maxItems });
	const seen = new Set(state.recent);
	const unseen = new Map(
		contacts
			.filter((contact) => ccData.textAt({ value: contact, key: 'contact_id' }) !== undefined)
			.map((contact): [string, UnknownRecord] => [eventKey({ contact, config }), contact])
			.filter(([key]) => !seen.has(key))
			.reverse(),
	);
	const fresh = [...unseen.values()].sort((a, b) => epochOf(eventTime({ contact: a, config })) - epochOf(eventTime({ contact: b, config })));
	const recentCutoff = end - OVERLAP_MS;
	const recent = [
		...state.recent.filter((key) => epochOf(key.slice(key.indexOf('|') + 1)) >= recentCutoff),
		...contacts.filter((contact) => epochOf(eventTime({ contact, config })) >= recentCutoff).map((contact) => eventKey({ contact, config })),
	];
	await store.put<PollState>(config.storeKey, { scanned_through: new Date(end).toISOString(), recent: [...new Set(recent)].slice(-MAX_RECENT_KEYS) });
	return fresh;
}

async function fetchWindow({
	accessToken,
	config,
	scannedThrough,
	pollStart,
	maxItems,
}: {
	accessToken: string;
	config: ContactPollConfig;
	scannedThrough: number;
	pollStart: number;
	maxItems: number;
}): Promise<{ contacts: UnknownRecord[]; end: number }> {
	let start = scannedThrough - OVERLAP_MS;
	let end = Math.max(pollStart, scannedThrough + 1);
	for (;;) {
		try {
			const contacts = await ccClient.listAll({
				accessToken,
				path: '/contacts',
				key: 'contacts',
				operation: config.operation,
				query: {
					...config.query,
					[config.afterParam]: new Date(start).toISOString(),
					[config.beforeParam]: new Date(end).toISOString(),
					include: CONTACT_INCLUDE,
					limit: PAGE_SIZE,
				},
				maxItems,
			});
			return { contacts, end };
		} catch (error) {
			if (!(error instanceof ConstantContactListCapError)) {
				throw error;
			}
			if (end - scannedThrough > MIN_WINDOW_MS) {
				end = scannedThrough + Math.floor((end - scannedThrough) / 2);
			} else if (start < scannedThrough) {
				start = scannedThrough;
			} else {
				throw new Error(
					`Constant Contact ${config.operation}: more than ${maxItems} contacts share one second (${new Date(scannedThrough).toISOString()}), so the trigger cannot page past them. Disable and re-enable the trigger to skip this batch.`,
				);
			}
		}
	}
}

async function sample({ accessToken, config }: { accessToken: string; config: ContactPollConfig }): Promise<UnknownRecord[]> {
	const page = await ccClient.listPage({
		accessToken,
		path: '/contacts',
		key: 'contacts',
		operation: config.operation,
		query: { ...config.query, include: CONTACT_INCLUDE, limit: SAMPLE_SIZE },
	});
	return page.items;
}

const OVERLAP_MS = 5 * 60 * 1000;
const PAGE_SIZE = 500;
const MAX_ITEMS_PER_POLL = 5000;
const MIN_WINDOW_MS = 1000;
const MAX_RECENT_KEYS = 5000;
const SAMPLE_SIZE = 5;

export const SAMPLE_CONTACT = {
	contact_id: '1618ae62-4752-11e9-9c8a-fa163e6b01c1',
	email_address: {
		address: 'jane.doe@example.com',
		permission_to_send: 'explicit',
		created_at: '2026-11-01T10:00:00Z',
		updated_at: '2026-11-01T10:00:00Z',
		opt_in_source: 'Account',
		opt_in_date: '2026-11-01T10:00:00Z',
		confirm_status: 'off',
	},
	first_name: 'Jane',
	last_name: 'Doe',
	job_title: 'Owner',
	company_name: 'Example Co',
	create_source: 'Account',
	update_source: 'Account',
	created_at: '2026-11-01T10:00:00Z',
	updated_at: '2026-11-01T10:00:00Z',
	phone_numbers: [{ phone_number_id: 'a2b3c4d5-0000-11e9-9c8a-fa163e6b01c1', phone_number: '+1 555 0100', kind: 'mobile' }],
	street_addresses: [],
	custom_fields: [],
	list_memberships: ['07936f78-662a-11eb-af0a-fa163e56c9b0'],
	taggings: [],
};

export const SAMPLE_UNSUBSCRIBED_CONTACT = {
	...SAMPLE_CONTACT,
	email_address: {
		...SAMPLE_CONTACT.email_address,
		permission_to_send: 'unsubscribed',
		updated_at: '2026-11-05T09:30:00Z',
		opt_out_source: 'Contact',
		opt_out_date: '2026-11-05T09:30:00Z',
		opt_out_reason: 'Too many emails',
	},
	updated_at: '2026-11-05T09:30:00Z',
};

export const contactPolling = { onEnable, onDisable, poll, sample, readState };

export type ContactPollConfig = {
	storeKey: string;
	operation: string;
	afterParam: 'created_after' | 'updated_after' | 'optout_after';
	beforeParam: 'created_before' | 'updated_before' | 'optout_before';
	timestampField: 'created_at' | 'updated_at' | 'opt_out_date';
	query: Record<string, string>;
};

export type PollState = {
	scanned_through: string;
	recent: string[];
};
