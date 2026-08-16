import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { quickbooksAuth } from './auth';
import { quickbooksApiCall, quickbooksQuery, QuickbooksCdcResponse, QuickbooksEntityResponse } from './common';
import { QuickbooksMetaData } from './types';

export function createQuickbooksCdcPolling<T extends QuickbooksChangedEntity>({
	entity,
	newOnly,
}: {
	entity: string;
	newOnly: boolean;
}): Polling<AppConnectionValueForAuthProperty<typeof quickbooksAuth>, Record<string, unknown>> {
	return {
		strategy: DedupeStrategy.TIMEBASED,
		async items({ auth, lastFetchEpochMS }) {
			const { access_token } = auth;
			const companyId = auth.props?.['companyId'] as string;

			const records = await fetchQuickbooksChanges<T>({
				accessToken: access_token,
				companyId,
				entity,
				lastFetchEpochMS,
				newOnly,
			});

			return records.map((record) => ({
				epochMilliSeconds: dayjs(record.MetaData?.LastUpdatedTime ?? record.MetaData?.CreateTime).valueOf(),
				data: record,
			}));
		},
	};
}

// The CDC endpoint only reports changes within the last 30 days; a gap longer than that
// (or the very first poll) falls back to a full SELECT ordered by last-updated time.
// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/change-data-capture#restrictions
const CDC_LOOKBACK_LIMIT_MS = 30 * 24 * 60 * 60 * 1000;

async function fetchQuickbooksChanges<T extends QuickbooksChangedEntity>({
	accessToken,
	companyId,
	entity,
	lastFetchEpochMS,
	newOnly,
}: {
	accessToken: string;
	companyId: string;
	entity: string;
	lastFetchEpochMS: number;
	newOnly: boolean;
}): Promise<T[]> {
	const withinCdcLookback =
		lastFetchEpochMS !== 0 && Date.now() - lastFetchEpochMS <= CDC_LOOKBACK_LIMIT_MS;

	const records = withinCdcLookback
		? await fetchViaCdc<T>({ accessToken, companyId, entity, lastFetchEpochMS })
		: await fetchViaFullSelect<T>({
				accessToken,
				companyId,
				entity,
				lastFetchEpochMS,
				isInitialFetch: lastFetchEpochMS === 0,
		  });

	const nonDeleted = records.filter((record) => record.status !== 'Deleted');

	if (!newOnly) {
		return nonDeleted;
	}

	// A record created since the last poll is "new" even if it was also edited before this
	// poll ran; comparing CreateTime to LastUpdatedTime instead would drop it permanently.
	const lastFetchCutoff = dayjs(lastFetchEpochMS);
	return nonDeleted.filter(
		(record) => record.MetaData?.CreateTime && dayjs(record.MetaData.CreateTime).isAfter(lastFetchCutoff),
	);
}

async function fetchViaCdc<T>({
	accessToken,
	companyId,
	entity,
	lastFetchEpochMS,
}: {
	accessToken: string;
	companyId: string;
	entity: string;
	lastFetchEpochMS: number;
}): Promise<T[]> {
	// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/change-data-capture
	const response = await quickbooksApiCall<QuickbooksCdcResponse<T>>({
		accessToken,
		companyId,
		method: HttpMethod.GET,
		resourceUri: '/cdc',
		query: {
			entities: entity,
			changedSince: dayjs(lastFetchEpochMS).toISOString(),
		},
	});

	const entityBlocks = response.CDCResponse?.[0]?.QueryResponse ?? [];
	return entityBlocks.flatMap((block) => (block[entity] as T[] | undefined) ?? []);
}

// Recovery after a long gap can match more entities than a single query response page holds;
// the checkpoint advances to the newest timestamp actually returned, so an unpaginated query
// would permanently skip whatever didn't fit in that first page.
const FULL_SELECT_PAGE_SIZE = 1000;
const FULL_SELECT_MAX_PAGES = 50;

async function fetchViaFullSelect<T>({
	accessToken,
	companyId,
	entity,
	lastFetchEpochMS,
	isInitialFetch,
}: {
	accessToken: string;
	companyId: string;
	entity: string;
	lastFetchEpochMS: number;
	isInitialFetch: boolean;
}): Promise<T[]> {
	if (isInitialFetch) {
		// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/requests/query
		const response = await quickbooksQuery<QuickbooksEntityResponse<T>>({
			accessToken,
			companyId,
			query: `SELECT * FROM ${entity} ORDERBY Metadata.LastUpdatedTime DESC MAXRESULTS 10`,
		});
		return response.QueryResponse?.[entity] ?? [];
	}

	const records: T[] = [];
	for (let page = 0; page < FULL_SELECT_MAX_PAGES; page++) {
		const startPosition = page * FULL_SELECT_PAGE_SIZE + 1;
		// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/requests/query
		const response = await quickbooksQuery<QuickbooksEntityResponse<T>>({
			accessToken,
			companyId,
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

interface QuickbooksChangedEntity {
	Id?: string;
	status?: string;
	MetaData?: QuickbooksMetaData;
}
