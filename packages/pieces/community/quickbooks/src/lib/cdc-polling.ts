import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { DedupeStrategy, httpClient, HttpMethod, Polling } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { quickbooksAuth } from './auth';
import { quickbooksCommon, QuickbooksCdcResponse, QuickbooksEntityResponse } from './common';
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
			const apiUrl = quickbooksCommon.getApiUrl(companyId);

			const records = await fetchQuickbooksChanges<T>({
				accessToken: access_token,
				apiUrl,
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
	apiUrl,
	entity,
	lastFetchEpochMS,
	newOnly,
}: {
	accessToken: string;
	apiUrl: string;
	entity: string;
	lastFetchEpochMS: number;
	newOnly: boolean;
}): Promise<T[]> {
	const withinCdcLookback =
		lastFetchEpochMS !== 0 && Date.now() - lastFetchEpochMS <= CDC_LOOKBACK_LIMIT_MS;

	const records = withinCdcLookback
		? await fetchViaCdc<T>({ accessToken, apiUrl, entity, lastFetchEpochMS })
		: await fetchViaFullSelect<T>({
				accessToken,
				apiUrl,
				entity,
				lastFetchEpochMS,
				isInitialFetch: lastFetchEpochMS === 0,
		  });

	const nonDeleted = records.filter((record) => record.status !== 'Deleted');

	if (!newOnly) {
		return nonDeleted;
	}

	return nonDeleted.filter(
		(record) =>
			record.MetaData?.CreateTime && record.MetaData.CreateTime === record.MetaData.LastUpdatedTime,
	);
}

async function fetchViaCdc<T>({
	accessToken,
	apiUrl,
	entity,
	lastFetchEpochMS,
}: {
	accessToken: string;
	apiUrl: string;
	entity: string;
	lastFetchEpochMS: number;
}): Promise<T[]> {
	// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/change-data-capture
	const response = await httpClient.sendRequest<QuickbooksCdcResponse<T>>({
		method: HttpMethod.GET,
		url: `${apiUrl}/cdc`,
		queryParams: {
			entities: entity,
			changedSince: dayjs(lastFetchEpochMS).toISOString(),
			minorversion: quickbooksCommon.minorVersion,
		},
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/json',
		},
	});

	const entityBlocks = response.body.CDCResponse?.[0]?.QueryResponse ?? [];
	return entityBlocks.flatMap((block) => (block[entity] as T[] | undefined) ?? []);
}

async function fetchViaFullSelect<T>({
	accessToken,
	apiUrl,
	entity,
	lastFetchEpochMS,
	isInitialFetch,
}: {
	accessToken: string;
	apiUrl: string;
	entity: string;
	lastFetchEpochMS: number;
	isInitialFetch: boolean;
}): Promise<T[]> {
	const query = isInitialFetch
		? `SELECT * FROM ${entity} ORDERBY Metadata.LastUpdatedTime DESC MAXRESULTS 10`
		: `SELECT * FROM ${entity} WHERE Metadata.LastUpdatedTime >= '${dayjs(
				lastFetchEpochMS,
		  ).toISOString()}' ORDERBY Metadata.LastUpdatedTime DESC`;

	// https://developer.intuit.com/app/developer/qbo/docs/api/accounting/requests/query
	const response = await httpClient.sendRequest<QuickbooksEntityResponse<T>>({
		method: HttpMethod.GET,
		url: `${apiUrl}/query`,
		queryParams: { query: query, minorversion: quickbooksCommon.minorVersion },
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/json',
		},
	});

	return response.body.QueryResponse?.[entity] ?? [];
}

interface QuickbooksChangedEntity {
	Id?: string;
	status?: string;
	MetaData?: QuickbooksMetaData;
}
