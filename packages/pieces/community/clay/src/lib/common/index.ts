import { httpClient, HttpMethod, HttpMessageBody, HttpResponse } from '@activepieces/pieces-common';

const BASE_URL = 'https://api.clay.com/public/v0';

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

export async function sendClayWebhookRecord({
    webhookUrl,
    authToken,
    fields,
}: {
    webhookUrl: string;
    authToken: string | undefined;
    fields: Record<string, unknown>;
}): Promise<HttpResponse<HttpMessageBody>> {
    return await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: webhookUrl,
        headers: authToken ? { 'x-clay-webhook-auth': authToken } : undefined,
        body: fields,
    });
}

export function flattenClayTableRow(row: Record<string, { value?: unknown } | undefined>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(row).map(([field, cell]) => [field, cell?.value ?? null]),
    );
}

export async function runClayFiltersModeSearch({
    apiKey,
    sourceType,
    filters,
    limit,
}: {
    apiKey: string;
    sourceType: 'people' | 'companies';
    filters: Record<string, unknown>;
    limit: number;
}): Promise<{
    search_id: string;
    records: unknown[];
    has_more: boolean;
    period_quota: { limit: number; used: number; remaining: number; resets_at: string };
}> {
    const created = await clayApiCall<{ search_id: string }>({
        apiKey,
        method: HttpMethod.POST,
        path: '/search/filters-mode',
        body: { source_type: sourceType, filters },
    });

    const results = await clayApiCall<{
        data: unknown[];
        has_more: boolean;
        period_quota: { limit: number; used: number; remaining: number; resets_at: string };
    }>({
        apiKey,
        method: HttpMethod.POST,
        path: `/search/filters-mode/${created.body.search_id}/run`,
        body: { limit },
    });

    return {
        search_id: created.body.search_id,
        records: results.body.data,
        has_more: results.body.has_more,
        period_quota: results.body.period_quota,
    };
}

export const CLAY_TABLE_FILTER_OPERATORS = [
    { label: 'Equals', value: '=' },
    { label: 'Not equals', value: '!=' },
    { label: 'Greater than', value: '>' },
    { label: 'Greater than or equal to', value: '>=' },
    { label: 'Less than', value: '<' },
    { label: 'Less than or equal to', value: '<=' },
    { label: 'Contains', value: 'contains' },
    { label: 'Does not contain', value: 'not_contains' },
    { label: 'Starts with', value: 'starts_with' },
    { label: 'Ends with', value: 'ends_with' },
    { label: 'Is empty', value: 'is_empty' },
    { label: 'Is not empty', value: 'is_not_empty' },
];
