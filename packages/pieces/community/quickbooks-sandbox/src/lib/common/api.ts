import { HttpMessageBody, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { quickbooksClient } from './client';
import type {
	QuickbooksAuthValue,
	QuickbooksCdcResponse,
	QuickbooksEntityResponse,
	QuickbooksMetaData,
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

export const quickbooksApi = { query, listChangedEntities };

const CDC_LOOKBACK_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;
const FULL_SELECT_PAGE_SIZE = 1000;
const FULL_SELECT_MAX_PAGES = 50;

type QuickbooksChangedEntity = {
	Id?: string;
	status?: string;
	MetaData?: QuickbooksMetaData;
};
