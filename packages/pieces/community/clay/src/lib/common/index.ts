import { httpClient, HttpMethod, HttpMessageBody, HttpResponse } from '@activepieces/pieces-common';

export async function clayApiCall<T extends HttpMessageBody>({
    apiKey,
    method,
    path,
    body,
    queryParams,
}: {
    apiKey: string;
    method: HttpMethod;
    path: string;
    body?: unknown;
    queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
    return await httpClient.sendRequest<T>({
        method,
        url: `${BASE_URL}${path}`,
        headers: {
            'clay-api-key': apiKey,
        },
        queryParams,
        body,
    });
}

export async function runClayQueryModeSearch({
    apiKey,
    sourceType,
    query,
    limit,
}: {
    apiKey: string;
    sourceType: 'people' | 'companies';
    query: string;
    limit: number;
}): Promise<{
    search_id: string;
    records: unknown[];
    has_more: boolean;
    period_quota: { limit: number; used: number; remaining: number; resets_at: string };
}> {
    const created = await clayApiCall<{ search_id: string; source_type: 'people' | 'companies' }>({
        apiKey,
        method: HttpMethod.POST,
        path: '/search/query-mode',
        body: { query },
    });

    if (created.body.source_type !== sourceType) {
        throw new Error(
            `Query resolved to a "${created.body.source_type}" search, but this action searches "${sourceType}". Rephrase the query to describe ${sourceType} instead.`,
        );
    }

    const results = await clayApiCall<{
        data: unknown[];
        has_more: boolean;
        period_quota: { limit: number; used: number; remaining: number; resets_at: string };
    }>({
        apiKey,
        method: HttpMethod.POST,
        path: `/search/query-mode/${created.body.search_id}/run`,
        body: { limit },
    });

    return {
        search_id: created.body.search_id,
        records: results.body.data,
        has_more: results.body.has_more,
        period_quota: results.body.period_quota,
    };
}

export function escapeClayQueryValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function buildClayInClause({
    field,
    values,
}: {
    field: string;
    values: string[];
}): string | undefined {
    if (values.length === 0) {
        return undefined;
    }
    const list = values.map((value) => `"${escapeClayQueryValue(value)}"`).join(', ');
    return `${field} in (${list})`;
}

const BASE_URL = 'https://api.clay.com/public/v0';
