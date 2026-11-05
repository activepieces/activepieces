import { HttpError, HttpMessageBody, HttpMethod } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { quickbooksClient } from './client';
import type {
	QuickbooksAuthValue,
	QuickbooksCdcResponse,
	QuickbooksEntityEnvelope,
	QuickbooksEntityResponse,
	QuickbooksMetaData,
	QuickbooksQueryEnvelope,
	QuickbooksRecord,
} from './types';

async function query<T extends HttpMessageBody>({
	auth,
	query,
}: {
	auth: QuickbooksAuthValue;
	query: string;
}): Promise<T> {
	return await quickbooksClient.request<T>({
		auth,
		method: HttpMethod.GET,
		path: '/query',
		query: { query },
	});
}

async function listChangedEntities<T extends QuickbooksChangedEntity>({
	auth,
	entity,
	lastFetchEpochMS,
	newOnly,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	lastFetchEpochMS: number;
	newOnly: boolean;
}): Promise<T[]> {
	const withinCdcLookback =
		lastFetchEpochMS !== 0 && Date.now() - lastFetchEpochMS <= CDC_LOOKBACK_LIMIT_MS;

	const records = withinCdcLookback
		? await fetchViaCdc<T>({ auth, entity, lastFetchEpochMS })
		: await fetchViaFullSelect<T>({
				auth,
				entity,
				lastFetchEpochMS,
				isInitialFetch: lastFetchEpochMS === 0,
		  });

	const nonDeleted = records.filter((record) => record.status !== 'Deleted');

	if (!newOnly) {
		return nonDeleted;
	}

	const lastFetchCutoff = dayjs(lastFetchEpochMS);
	return nonDeleted.filter(
		(record) => record.MetaData?.CreateTime && dayjs(record.MetaData.CreateTime).isAfter(lastFetchCutoff),
	);
}

async function fetchViaCdc<T>({
	auth,
	entity,
	lastFetchEpochMS,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	lastFetchEpochMS: number;
}): Promise<T[]> {
	const response = await quickbooksClient.request<QuickbooksCdcResponse<T>>({
		auth,
		method: HttpMethod.GET,
		path: '/cdc',
		query: {
			entities: entity,
			changedSince: dayjs(lastFetchEpochMS).toISOString(),
		},
	});

	const entityBlocks = response.CDCResponse?.[0]?.QueryResponse ?? [];
	return entityBlocks.flatMap((block) => block[entity] ?? []);
}

async function fetchViaFullSelect<T>({
	auth,
	entity,
	lastFetchEpochMS,
	isInitialFetch,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	lastFetchEpochMS: number;
	isInitialFetch: boolean;
}): Promise<T[]> {
	if (isInitialFetch) {
		const response = await query<QuickbooksEntityResponse<T>>({
			auth,
			query: `SELECT * FROM ${entity} ORDERBY Metadata.LastUpdatedTime DESC MAXRESULTS 10`,
		});
		return response.QueryResponse?.[entity] ?? [];
	}

	const records: T[] = [];
	for (let page = 0; page < FULL_SELECT_MAX_PAGES; page++) {
		const startPosition = page * FULL_SELECT_PAGE_SIZE + 1;
		const response = await query<QuickbooksEntityResponse<T>>({
			auth,
			query: `SELECT * FROM ${entity} WHERE Metadata.LastUpdatedTime >= '${dayjs(
				lastFetchEpochMS,
			).toISOString()}' ORDERBY Metadata.LastUpdatedTime ASC STARTPOSITION ${startPosition} MAXRESULTS ${FULL_SELECT_PAGE_SIZE}`,
		});

		const batch = response.QueryResponse?.[entity] ?? [];
		records.push(...batch);

		if (batch.length < FULL_SELECT_PAGE_SIZE) {
			break;
		}
	}

	return records;
}

async function getEntity({
	auth,
	entity,
	id,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	id: string;
}): Promise<QuickbooksEntityEnvelope> {
	return await quickbooksClient.request<QuickbooksEntityEnvelope>({
		auth,
		method: HttpMethod.GET,
		path: `/${entity.toLowerCase()}/${encodeURIComponent(id)}`,
	});
}

async function listEntities({
	auth,
	entity,
	where,
	orderBy,
	limit,
	startPosition,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	where?: string;
	orderBy?: string;
	limit?: number;
	startPosition?: number;
}): Promise<QuickbooksListResult> {
	const maxResults = Math.min(Math.max(Math.trunc(limit ?? DEFAULT_LIST_LIMIT), 1), MAX_LIST_LIMIT);
	const start = Math.max(Math.trunc(startPosition ?? 1), 1);
	const clauses = [
		`SELECT * FROM ${entity}`,
		...(where ? [`WHERE ${where}`] : []),
		...(orderBy ? [`ORDERBY ${orderBy}`] : []),
		`STARTPOSITION ${start}`,
		`MAXRESULTS ${maxResults}`,
	];
	const response = await query<QuickbooksQueryEnvelope>({ auth, query: clauses.join(' ') });
	const records = response.QueryResponse?.[responseKey({ entity })] ?? [];
	return {
		[entity]: records,
		startPosition: start,
		maxResults,
		count: records.length,
		nextStartPosition: records.length === maxResults ? start + maxResults : null,
	};
}

async function createEntity({
	auth,
	entity,
	body,
	query,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	body: Record<string, unknown>;
	query?: Record<string, string | undefined>;
}): Promise<QuickbooksEntityEnvelope> {
	return await quickbooksClient.request<QuickbooksEntityEnvelope>({
		auth,
		method: HttpMethod.POST,
		path: `/${entity.toLowerCase()}`,
		query,
		body,
	});
}

async function updateEntity({
	auth,
	entity,
	id,
	fields,
	requiredFields = [],
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	id: string;
	fields: Record<string, unknown>;
	requiredFields?: string[];
}): Promise<QuickbooksEntityEnvelope> {
	return await writeLatestVersion({
		auth,
		entity,
		id,
		buildBody: (current) => ({
			...Object.fromEntries(requiredFields.map((field) => [field, current[field]])),
			...fields,
			Id: current.Id,
			SyncToken: current.SyncToken,
			sparse: true,
		}),
	});
}

async function replaceEntity({
	auth,
	entity,
	id,
	fields,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	id: string;
	fields: Record<string, unknown>;
}): Promise<QuickbooksEntityEnvelope> {
	return await writeLatestVersion({
		auth,
		entity,
		id,
		buildBody: (current) => ({ ...current, ...fields, Id: current.Id, SyncToken: current.SyncToken }),
	});
}

async function deleteEntity({
	auth,
	entity,
	id,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	id: string;
}): Promise<QuickbooksEntityEnvelope> {
	return await writeLatestVersion({
		auth,
		entity,
		id,
		query: { operation: 'delete' },
		buildBody: (current) => ({ Id: current.Id, SyncToken: current.SyncToken }),
	});
}

async function voidEntity({
	auth,
	entity,
	id,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	id: string;
}): Promise<QuickbooksEntityEnvelope> {
	return await writeLatestVersion({
		auth,
		entity,
		id,
		query: { operation: 'void' },
		buildBody: (current) => ({ Id: current.Id, SyncToken: current.SyncToken }),
	});
}

async function voidWithUpdate({
	auth,
	entity,
	id,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	id: string;
}): Promise<QuickbooksEntityEnvelope> {
	return await writeLatestVersion({
		auth,
		entity,
		id,
		query: { operation: 'update', include: 'void' },
		buildBody: (current) => ({ Id: current.Id, SyncToken: current.SyncToken, sparse: true }),
	});
}

async function sendEntity({
	auth,
	entity,
	id,
	sendTo,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	id: string;
	sendTo?: string;
}): Promise<QuickbooksEntityEnvelope> {
	return await quickbooksClient.request<QuickbooksEntityEnvelope>({
		auth,
		method: HttpMethod.POST,
		path: `/${entity.toLowerCase()}/${encodeURIComponent(id)}/send`,
		query: { sendTo },
	});
}

async function downloadPdf({
	auth,
	entity,
	id,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	id: string;
}): Promise<Buffer> {
	return await quickbooksClient.request<Buffer>({
		auth,
		method: HttpMethod.GET,
		path: `/${entity.toLowerCase()}/${encodeURIComponent(id)}/pdf`,
		accept: 'application/pdf',
		responseType: 'arraybuffer',
	});
}

async function getReport({
	auth,
	report,
	query,
}: {
	auth: QuickbooksAuthValue;
	report: string;
	query: Record<string, string | number | boolean | undefined>;
}): Promise<Record<string, unknown>> {
	return await quickbooksClient.request<Record<string, unknown>>({
		auth,
		method: HttpMethod.GET,
		path: `/reports/${report}`,
		query,
	});
}

async function readRecord({
	auth,
	entity,
	id,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	id: string;
}): Promise<QuickbooksRecord> {
	const response = await getEntity({ auth, entity, id });
	const record = response[responseKey({ entity })];
	if (!record) {
		throw new Error(`QuickBooks returned no ${entity} with id ${id}.`);
	}
	return record;
}

async function writeLatestVersion({
	auth,
	entity,
	id,
	query,
	buildBody,
}: {
	auth: QuickbooksAuthValue;
	entity: string;
	id: string;
	query?: Record<string, string | undefined>;
	buildBody: (current: QuickbooksRecord) => Record<string, unknown>;
}): Promise<QuickbooksEntityEnvelope> {
	const write = async () => {
		const current = await readRecord({ auth, entity, id });
		return await createEntity({ auth, entity, query, body: buildBody(current) });
	};
	const { data, error } = await tryCatch(write);
	if (!error) {
		return data;
	}
	if (!isStaleObjectError({ error })) {
		throw error;
	}
	return await write();
}

function isStaleObjectError({ error }: { error: unknown }): boolean {
	return error instanceof HttpError && JSON.stringify(error.response.body).includes(`"code":"${STALE_OBJECT_ERROR_CODE}"`);
}

function responseKey({ entity }: { entity: string }): string {
	return TXN_SUFFIXED_ENTITIES.includes(entity) ? `${entity}Txn` : entity;
}

export const quickbooksApi = {
	query,
	listChangedEntities,
	getEntity,
	listEntities,
	createEntity,
	updateEntity,
	replaceEntity,
	deleteEntity,
	voidEntity,
	voidWithUpdate,
	sendEntity,
	downloadPdf,
	getReport,
};

const CDC_LOOKBACK_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;
const FULL_SELECT_PAGE_SIZE = 1000;
const FULL_SELECT_MAX_PAGES = 50;
const DEFAULT_LIST_LIMIT = 100;
const MAX_LIST_LIMIT = 1000;
const TXN_SUFFIXED_ENTITIES = ['CreditCardPayment'];
const STALE_OBJECT_ERROR_CODE = '5010';

type QuickbooksChangedEntity = {
	Id?: string;
	status?: string;
	MetaData?: QuickbooksMetaData;
};

type QuickbooksListResult = {
	[entityName: string]: QuickbooksRecord[] | number | null;
};
