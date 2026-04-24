import {
    httpClient,
    HttpMethod,
    HttpError,
    HttpMessageBody,
    HttpResponse,
} from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, Property } from '@activepieces/pieces-framework';
import { descriptAuth } from '../..';

const BASE_URL = 'https://descriptapi.com/v1';

async function descriptApiCall<T extends HttpMessageBody>({
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
    const request = {
        method,
        url: `${BASE_URL}${path}`,
        headers: {
            Authorization: `Bearer ${normalizeToken(apiKey)}`,
        },
        body,
        queryParams,
    };

    logRequest({
        method,
        url: request.url,
        apiKey,
        body,
        queryParams,
    });

    try {
        const response = await httpClient.sendRequest<T>(request);
        logResponse({
            method,
            url: request.url,
            status: response.status,
            body: response.body,
        });
        return response;
    } catch (error) {
        logError({
            method,
            url: request.url,
            error,
        });
        throw error;
    }
}

async function fetchAllProjects(apiKey: string): Promise<{ id: string; name: string }[]> {
    const projects: { id: string; name: string }[] = [];
    let cursor: string | undefined = undefined;

    do {
        const params: Record<string, string> = { limit: '100', sort: 'name', direction: 'asc' };
        if (cursor) params['cursor'] = cursor;

        const response = await descriptApiCall<{
            data: { id: string; name: string }[];
            pagination: { next_cursor?: string };
        }>({
            apiKey,
            method: HttpMethod.GET,
            path: '/projects',
            queryParams: params,
        });

        projects.push(...response.body.data);
        cursor = response.body.pagination.next_cursor;
    } while (cursor);

    return projects;
}

function getAuthToken(
    auth: string | AppConnectionValueForAuthProperty<typeof descriptAuth>,
): string {
    return typeof auth === 'string' ? normalizeToken(auth) : normalizeToken(auth.secret_text);
}

function normalizeToken(token: string): string {
    return token.trim();
}

function shouldDebugHttp(): boolean {
    return process.env['AP_DESCRIPT_HTTP_DEBUG'] === 'true';
}

function logRequest({
    method,
    url,
    apiKey,
    body,
    queryParams,
}: {
    method: HttpMethod;
    url: string;
    apiKey: string;
    body?: unknown;
    queryParams?: Record<string, string>;
}): void {
    if (!shouldDebugHttp()) {
        return;
    }

    console.log('[descript][request]', {
        method,
        url,
        authorization: `Bearer ${maskToken(apiKey)}`,
        queryParams: queryParams ?? null,
        body: body ?? null,
    });
}

function logResponse({
    method,
    url,
    status,
    body,
}: {
    method: HttpMethod;
    url: string;
    status: number;
    body: unknown;
}): void {
    if (!shouldDebugHttp()) {
        return;
    }

    console.log('[descript][response]', {
        method,
        url,
        status,
        body,
    });
}

function logError({
    method,
    url,
    error,
}: {
    method: HttpMethod;
    url: string;
    error: unknown;
}): void {
    if (!shouldDebugHttp()) {
        return;
    }

    if (error instanceof HttpError) {
        console.error('[descript][error]', {
            method,
            url,
            status: error.response.status,
            responseBody: error.response.body,
            requestBody: error.request.body,
        });
        return;
    }

    console.error('[descript][error]', {
        method,
        url,
        error,
    });
}

function maskToken(token: string): string {
    const normalized = normalizeToken(token);
    if (normalized.length <= 8) {
        return '***';
    }
    return `${normalized.slice(0, 4)}...${normalized.slice(-4)}`;
}

const projectIdProp = Property.Dropdown({
    auth: descriptAuth,
    displayName: 'Project',
    description: 'Select the Descript project to use.',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
        if (!auth) {
            return { disabled: true, options: [], placeholder: 'Please connect your account first' };
        }
        const projects = await fetchAllProjects(getAuthToken(auth));
        return {
            disabled: false,
            options: projects.map((p) => ({ label: p.name, value: p.id })),
        };
    },
});

const compositionIdProp = (required: boolean) =>
    Property.Dropdown({
        auth: descriptAuth,
        displayName: 'Composition',
        description:
            'Select the composition (timeline) within the project. If omitted, the agent chooses automatically.',
        refreshers: ['project_id'],
        required,
        options: async ({ auth, project_id }) => {
            if (!auth || !project_id) {
                return { disabled: true, options: [], placeholder: 'Please select a project first' };
            }
            const response = await descriptApiCall<{
                id: string;
                name: string;
                compositions: { id: string; name: string }[];
            }>({
                apiKey: getAuthToken(auth),
                method: HttpMethod.GET,
                path: `/projects/${project_id as string}`,
            });
            return {
                disabled: false,
                options: response.body.compositions.map((c) => ({ label: c.name, value: c.id })),
            };
        },
    });

export const descriptCommon = {
    BASE_URL,
    descriptApiCall,
    fetchAllProjects,
    getAuthToken,
    projectIdProp,
    compositionIdProp,
};
