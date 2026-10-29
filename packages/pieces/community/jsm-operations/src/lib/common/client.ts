import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import {
    AccountAuthProps,
    AccountRoute,
    AlertActionResult,
    AlertIdentifierType,
    AlertOutput,
    ApiAlert,
    ApiAsyncResponse,
    ApiNote,
    ApiRequestStatus,
    JsmAuthValue,
    KeyAuthProps,
    KeyRoute,
    RequestResult,
    Route,
} from './types';

export const jsmOps = {
    isKeyConnection,
    keyProps,
    resolveKeyHost,
    normalizeSiteUrl,
    resolveCloudId,
    fillCloudId,
    accountBaseUrl,
    keyBaseUrl,
    authHeaders,
    routeFor,
    requireAccountRoute,
    send,
    sendToSite,
    resolveAlertId,
    getAlert,
    runAsync,
    awaitRequest,
    sendAlertAction,
    runAccountAlertRequest,
    changeTags,
    addNote,
    toAlertOutput,
    parseStringList,
    describeError,
    validateAccount,
    validateKey,
};

export const JSM_ACCOUNT_API_URL = 'https://api.atlassian.com/jsm/ops/api';
export const KEY_HOSTS = {
    jsm: 'https://api.atlassian.com/jsm/ops/integration',
    opsgenieUs: 'https://api.opsgenie.com',
    opsgenieEu: 'https://api.eu.opsgenie.com',
};
export const REQUEST_TIMEOUT_MS = 15_000;
export const POLL_TIMEOUT_MS = 4_000;
export const POLL_DELAYS_MS = [500, 1_000, 2_000, 3_000, 4_000];

function isKeyConnection<T extends { type: AppConnectionType }>(auth: T): auth is Extract<T, { type: AppConnectionType.BASIC_AUTH }> {
    return auth.type === AppConnectionType.BASIC_AUTH;
}

function keyProps({ username, password }: { username: string; password: string }): KeyAuthProps {
    return { host: resolveKeyHost(username), apiKey: password.trim() };
}

function resolveKeyHost(value: string): string {
    const normalized = value.trim().toLowerCase().replace(/\/+$/, '');
    const alias = KEY_HOST_ALIASES[normalized];
    if (alias !== undefined) {
        return alias;
    }
    const withScheme = normalized.startsWith('https://') ? normalized : `https://${normalized}`;
    const host = Object.values(KEY_HOSTS).find((allowed) => allowed === withScheme);
    if (host === undefined) {
        throw new Error('Unknown API host. Edit the connection and enter jsm, us or eu as the API host.');
    }
    return host;
}

function normalizeSiteUrl(raw: string): string {
    const trimmed = raw.trim().replace(/\/+$/, '');
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    let parsed: URL;
    try {
        parsed = new URL(withScheme);
    } catch {
        throw new Error(`"${raw}" is not a valid Atlassian site URL. Use the form https://your-company.atlassian.net.`);
    }
    const host = parsed.hostname.toLowerCase();
    const allowedHost = ALLOWED_SITE_SUFFIXES.some((suffix) => host.endsWith(suffix) && host.length > suffix.length);
    if (parsed.protocol !== 'https:' || !allowedHost || parsed.port !== '' || parsed.username !== '' || parsed.password !== '') {
        throw new Error(`"${raw}" is not an Atlassian Cloud site. Use the form https://your-company.atlassian.net.`);
    }
    return `https://${host}`;
}

async function resolveCloudId(props: AccountAuthProps): Promise<string> {
    const configured = props.cloudId?.trim();
    if (configured !== undefined && configured.length > 0) {
        if (!CLOUD_ID_PATTERN.test(configured)) {
            throw new Error('The Cloud ID can only contain letters, numbers and dashes. Leave it empty to look it up automatically.');
        }
        return configured;
    }
    const siteUrl = normalizeSiteUrl(props.siteUrl);
    let body: { cloudId?: unknown };
    try {
        const response = await httpClient.sendRequest<{ cloudId?: unknown }>({
            method: HttpMethod.GET,
            url: `${siteUrl}/_edge/tenant_info`,
            followRedirects: false,
            timeout: REQUEST_TIMEOUT_MS,
        });
        body = response.body;
    } catch (error) {
        throw new Error(`Could not look up the Cloud ID for ${siteUrl}: ${describeError(error)}. Check the site URL, or enter the Cloud ID.`);
    }
    const cloudId = typeof body?.cloudId === 'string' ? body.cloudId : '';
    if (!CLOUD_ID_PATTERN.test(cloudId)) {
        throw new Error(`${siteUrl} did not return a Cloud ID. Check the site URL, or enter the Cloud ID.`);
    }
    return cloudId;
}

async function fillCloudId<P extends AccountAuthProps>(props: P): Promise<P & { cloudId: string }> {
    const cloudId = await resolveCloudId(props);
    return { ...props, cloudId };
}

function accountBaseUrl(cloudId: string): string {
    return `${JSM_ACCOUNT_API_URL}/${encodeURIComponent(cloudId)}/v1`;
}

function keyBaseUrl(props: KeyAuthProps): string {
    return `${resolveKeyHost(props.host)}/v2`;
}

function authHeaders(auth: JsmAuthValue): Record<string, string> {
    if (isKeyConnection(auth)) {
        return { Authorization: `GenieKey ${keyProps(auth).apiKey}` };
    }
    const token = Buffer.from(`${auth.props.email.trim()}:${auth.props.apiToken}`).toString('base64');
    return { Authorization: `Basic ${token}` };
}

async function routeFor(auth: JsmAuthValue): Promise<Route> {
    if (isKeyConnection(auth)) {
        const route: KeyRoute = { kind: 'key', baseUrl: keyBaseUrl(keyProps(auth)), headers: authHeaders(auth) };
        return route;
    }
    const cloudId = await resolveCloudId(auth.props);
    return {
        kind: 'account',
        baseUrl: accountBaseUrl(cloudId),
        siteUrl: normalizeSiteUrl(auth.props.siteUrl),
        headers: authHeaders(auth),
    };
}

async function requireAccountRoute({ auth, feature }: { auth: JsmAuthValue; feature: string }): Promise<AccountRoute> {
    if (isKeyConnection(auth)) {
        throw new Error(
            `${feature} needs an Atlassian account connection. Alert API keys can only create, acknowledge and close alerts or add notes. Create an "Atlassian Account" connection (site URL, email and API token) and use it for this step.`,
        );
    }
    const route = await routeFor(auth);
    if (route.kind !== 'account') {
        throw new Error(`${feature} needs an Atlassian account connection.`);
    }
    return route;
}

async function send<T>({ route, method, path, queryParams, body, timeout }: SendParams): Promise<T> {
    try {
        const response = await httpClient.sendRequest<T>({
            method,
            url: `${route.baseUrl}${path}`,
            headers: { ...route.headers, Accept: 'application/json' },
            queryParams,
            body,
            followRedirects: false,
            timeout: timeout ?? REQUEST_TIMEOUT_MS,
        });
        return response.body;
    } catch (error) {
        throw new Error(describeError(error));
    }
}

async function sendToSite<T>({ route, path, queryParams }: SiteParams): Promise<T> {
    try {
        const response = await httpClient.sendRequest<T>({
            method: HttpMethod.GET,
            url: `${route.siteUrl}${path}`,
            headers: { ...route.headers, Accept: 'application/json' },
            queryParams,
            followRedirects: false,
            timeout: REQUEST_TIMEOUT_MS,
        });
        return response.body;
    } catch (error) {
        throw new Error(describeError(error));
    }
}

async function resolveAlertId({ route, alert, identifierType }: AlertLookup): Promise<string> {
    const value = requireIdentifier(alert);
    if (identifierType !== 'alias') {
        return value;
    }
    const found = await send<ApiAlert>({
        route,
        method: HttpMethod.GET,
        path: '/alerts/alias',
        queryParams: { alias: value },
    });
    if (typeof found.id !== 'string' || found.id.length === 0) {
        throw new Error(`No alert was found with the alias "${value}".`);
    }
    return found.id;
}

async function getAlert({ route, alert, identifierType }: AlertLookup): Promise<ApiAlert> {
    const value = requireIdentifier(alert);
    if (identifierType === 'alias') {
        return send<ApiAlert>({ route, method: HttpMethod.GET, path: '/alerts/alias', queryParams: { alias: value } });
    }
    return send<ApiAlert>({ route, method: HttpMethod.GET, path: `/alerts/${encodeURIComponent(value)}` });
}

async function runAsync({ route, method, path, queryParams, body, verb }: AsyncParams): Promise<RequestResult> {
    const accepted = await send<ApiAsyncResponse>({ route, method, path, queryParams, body });
    const requestId = accepted?.requestId;
    if (typeof requestId !== 'string' || requestId.length === 0) {
        throw new Error(`JSM Operations accepted the request to ${verb} but did not return a request ID.`);
    }
    const result = await awaitRequest({ route, requestId });
    if (result.processed && result.success === false) {
        throw new Error(requestFailureMessage({ verb, status: result.status }));
    }
    return result;
}

async function awaitRequest({ route, requestId }: { route: Route; requestId: string }): Promise<RequestResult> {
    for (const delay of POLL_DELAYS_MS) {
        await sleep(delay);
        const status = await fetchRequestStatus({ route, requestId });
        if (status !== null) {
            return {
                request_id: requestId,
                processed: true,
                success: status.isSuccess ?? status.success ?? null,
                action: status.action ?? null,
                status: status.status ?? null,
                alert_id: nonEmpty(status.alertId),
                alias: nonEmpty(status.alias),
                processed_at: status.processedAt ?? null,
            };
        }
    }
    return {
        request_id: requestId,
        processed: false,
        success: null,
        action: null,
        status: 'Still processing. Look the request up later with its request ID.',
        alert_id: null,
        alias: null,
        processed_at: null,
    };
}

async function sendAlertAction({ auth, alert, identifierType, action, note, user, source }: AlertActionParams): Promise<AlertActionResult> {
    const route = await routeFor(auth);
    const verb = action === 'acknowledge' ? 'acknowledge the alert' : 'close the alert';
    const cleanNote = nonEmpty(note);
    if (route.kind === 'key') {
        const result = await runAsync({
            route,
            method: HttpMethod.POST,
            path: `/alerts/${encodeURIComponent(requireIdentifier(alert))}/${action}`,
            queryParams: { identifierType },
            body: compact({ note: cleanNote, user: nonEmpty(user), source: nonEmpty(source) }),
            verb,
        });
        return { ...result, note_added: cleanNote === null ? null : result.success, note_error: null };
    }
    const alertId = await resolveAlertId({ route, alert, identifierType });
    const result = await runAsync({
        route,
        method: HttpMethod.POST,
        path: `/alerts/${encodeURIComponent(alertId)}/${action}`,
        verb,
    });
    const withId = { ...result, alert_id: result.alert_id ?? alertId };
    if (cleanNote === null) {
        return { ...withId, note_added: null, note_error: null };
    }
    try {
        await send<ApiNote>({
            route,
            method: HttpMethod.POST,
            path: `/alerts/${encodeURIComponent(alertId)}/notes`,
            body: { note: cleanNote },
        });
        return { ...withId, note_added: true, note_error: null };
    } catch (error) {
        return { ...withId, note_added: false, note_error: `The alert was updated, but the note could not be added: ${describeError(error)}` };
    }
}

async function runAccountAlertRequest({ auth, feature, alert, identifierType, method, suffix, body, verb }: AccountAlertRequestParams): Promise<RequestResult> {
    const route = await requireAccountRoute({ auth, feature });
    const alertId = await resolveAlertId({ route, alert, identifierType });
    const result = await runAsync({
        route,
        method,
        path: `/alerts/${encodeURIComponent(alertId)}/${suffix}`,
        body,
        verb,
    });
    return { ...result, alert_id: result.alert_id ?? alertId };
}

async function changeTags({ auth, alert, identifierType, tags, operation }: ChangeTagsParams): Promise<RequestResult> {
    const list = parseStringList(tags);
    if (list.length === 0) {
        throw new Error('Enter at least one tag.');
    }
    return runAccountAlertRequest({
        auth,
        feature: operation === 'add' ? 'Add Tags to Alert' : 'Remove Tags from Alert',
        alert,
        identifierType,
        method: operation === 'add' ? HttpMethod.POST : HttpMethod.DELETE,
        suffix: 'tags',
        body: { tags: list },
        verb: operation === 'add' ? 'add the tags' : 'remove the tags',
    });
}

async function addNote({ auth, alert, identifierType, note, user, source }: AddNoteParams): Promise<NoteResult> {
    const route = await routeFor(auth);
    const text = nonEmpty(note);
    if (text === null) {
        throw new Error('Enter the note text.');
    }
    if (route.kind === 'key') {
        const result = await runAsync({
            route,
            method: HttpMethod.POST,
            path: `/alerts/${encodeURIComponent(requireIdentifier(alert))}/notes`,
            queryParams: { identifierType },
            body: compact({ note: text, user: nonEmpty(user), source: nonEmpty(source) }),
            verb: 'add the note',
        });
        return { ...result, note_id: null, note: text };
    }
    const alertId = await resolveAlertId({ route, alert, identifierType });
    const created = await send<ApiNote>({
        route,
        method: HttpMethod.POST,
        path: `/alerts/${encodeURIComponent(alertId)}/notes`,
        body: { note: text },
    });
    return {
        request_id: null,
        processed: true,
        success: true,
        action: 'AddNote',
        status: 'Note added',
        alert_id: alertId,
        alias: identifierType === 'alias' ? requireIdentifier(alert) : null,
        processed_at: created?.createdAt ?? null,
        note_id: nonEmpty(created?.id),
        note: created?.note ?? text,
    };
}

function toAlertOutput(alert: ApiAlert): AlertOutput {
    return {
        id: nonEmpty(alert.id),
        tiny_id: nonEmpty(alert.tinyId),
        message: alert.message ?? null,
        description: alert.description ?? null,
        status: alert.status ?? null,
        priority: alert.priority ?? null,
        alias: nonEmpty(alert.alias),
        entity: nonEmpty(alert.entity),
        source: nonEmpty(alert.source),
        owner: nonEmpty(alert.owner),
        acknowledged: typeof alert.acknowledged === 'boolean' ? alert.acknowledged : null,
        seen: typeof alert.seen === 'boolean' ? alert.seen : null,
        snoozed: typeof alert.snoozed === 'boolean' ? alert.snoozed : null,
        snoozed_until: alert.snoozedUntil ?? null,
        count: typeof alert.count === 'number' ? alert.count : null,
        tags: joinList(alert.tags),
        actions: joinList(alert.actions),
        responders: joinList((alert.responders ?? []).map((responder) => `${responder.type}:${responder.id ?? responder.name ?? responder.username ?? ''}`)),
        extra_properties: alert.extraProperties ?? {},
        integration_name: nonEmpty(alert.integrationName),
        integration_type: nonEmpty(alert.integrationType),
        created_at: alert.createdAt ?? null,
        updated_at: alert.updatedAt ?? null,
        last_occurred_at: alert.lastOccurredAt ?? alert.lastOccuredAt ?? null,
        ack_time: alert.ackTime ?? null,
        close_time: alert.closeTime ?? null,
    };
}

function parseStringList(value: unknown): string[] {
    const list = typeof value === 'string' ? parseJsonList(value) : value;
    if (!Array.isArray(list)) {
        return [];
    }
    return list
        .map((item) => (typeof item === 'string' || typeof item === 'number' ? String(item).trim() : ''))
        .filter((item) => item.length > 0);
}

function requestFailureMessage({ verb, status }: { verb: string; status: string | null | undefined }): string {
    const reason = (status ?? 'the request failed').replace(/\.+$/, '');
    const planHint = /plan does not support/i.test(reason)
        ? ' This action is not included in your Jira Service Management plan (for example, the Free plan). Upgrade the plan or skip this step.'
        : '';
    return `JSM Operations could not ${verb}: ${reason}.${planHint}`;
}

function describeError(error: unknown): string {
    if (!(error instanceof HttpError)) {
        return error instanceof Error ? error.message : String(error);
    }
    const status = error.response.status;
    const detail = readErrorMessage(error.response.body);
    const base = `JSM Operations error (HTTP ${status})${detail.length > 0 ? `: ${detail}` : ''}`;
    const hint = STATUS_HINTS[status];
    return hint === undefined ? base : `${base}. ${hint}`;
}

async function validateAccount(props: AccountAuthProps): Promise<ValidationResult> {
    try {
        const route = await routeFor({ type: AppConnectionType.CUSTOM_AUTH, props });
        await send<unknown>({ route, method: HttpMethod.GET, path: '/alerts', queryParams: { size: '1' } });
        return { valid: true };
    } catch (error) {
        return { valid: false, error: describeError(error) };
    }
}

async function validateKey({ username, password }: { username: string; password: string }): Promise<ValidationResult> {
    let route: Route;
    try {
        route = await routeFor({ type: AppConnectionType.BASIC_AUTH, username, password });
    } catch (error) {
        return { valid: false, error: describeError(error) };
    }
    try {
        await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${route.baseUrl}/alerts/requests/${VALIDATION_REQUEST_ID}`,
            headers: route.headers,
            followRedirects: false,
            timeout: REQUEST_TIMEOUT_MS,
        });
        return { valid: true };
    } catch (error) {
        const status = error instanceof HttpError ? error.response.status : undefined;
        if (status === 404 || status === 422 || status === 400) {
            return { valid: true };
        }
        return { valid: false, error: describeError(error) };
    }
}

async function fetchRequestStatus({ route, requestId }: { route: Route; requestId: string }): Promise<ApiRequestStatus | null> {
    let body: WrappedRequestStatus;
    try {
        const response = await httpClient.sendRequest<WrappedRequestStatus>({
            method: HttpMethod.GET,
            url: `${route.baseUrl}/alerts/requests/${encodeURIComponent(requestId)}`,
            headers: { ...route.headers, Accept: 'application/json' },
            followRedirects: false,
            timeout: POLL_TIMEOUT_MS,
        });
        body = response.body;
    } catch (error) {
        if (error instanceof HttpError && error.response.status === 404) {
            return null;
        }
        throw new Error(describeError(error));
    }
    const status = body?.data ?? body;
    if (status === undefined || status === null || (status.isSuccess === undefined && status.success === undefined)) {
        return null;
    }
    return status;
}

function readErrorMessage(body: unknown): string {
    const parsed = typeof body === 'string' ? parseJson(body) : body;
    if (typeof parsed === 'string') {
        return parsed.length > 300 ? `${parsed.slice(0, 300)}…` : parsed;
    }
    if (parsed === null || typeof parsed !== 'object') {
        return '';
    }
    const parts: string[] = [];
    if ('message' in parsed && typeof parsed.message === 'string') {
        parts.push(parsed.message);
    }
    if ('errors' in parsed) {
        parts.push(...describeErrorList(parsed.errors));
    }
    if ('errorMessages' in parsed && Array.isArray(parsed.errorMessages)) {
        parts.push(...parsed.errorMessages.filter((item): item is string => typeof item === 'string'));
    }
    return parts.join('; ');
}

function describeErrorList(errors: unknown): string[] {
    if (Array.isArray(errors)) {
        return errors.flatMap((item) => {
            if (typeof item === 'string') {
                return [item];
            }
            if (item !== null && typeof item === 'object' && 'title' in item && typeof item.title === 'string') {
                return [item.title];
            }
            return [];
        });
    }
    if (errors !== null && typeof errors === 'object') {
        return Object.entries(errors).map(([field, message]) => `${field}: ${String(message)}`);
    }
    return [];
}

function parseJson(text: string): unknown {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function parseJsonList(text: string): unknown {
    const trimmed = text.trim();
    if (trimmed.startsWith('[')) {
        return parseJson(trimmed);
    }
    return trimmed.split(',');
}

function requireIdentifier(alert: string | undefined): string {
    const value = alert?.trim() ?? '';
    if (value.length === 0) {
        throw new Error('Enter the alert ID or alias.');
    }
    return value;
}

function nonEmpty(value: string | undefined | null): string | null {
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function joinList(values: string[] | undefined): string | null {
    if (!Array.isArray(values) || values.length === 0) {
        return null;
    }
    return values.join(', ');
}

function compact(values: Record<string, string | null>): Record<string, string> {
    return Object.fromEntries(
        Object.entries(values).flatMap(([key, value]) => (value === null ? [] : [[key, value]])),
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const KEY_HOST_ALIASES: Record<string, string> = {
    jsm: KEY_HOSTS.jsm,
    us: KEY_HOSTS.opsgenieUs,
    eu: KEY_HOSTS.opsgenieEu,
};
const ALLOWED_SITE_SUFFIXES = ['.atlassian.net', '.jira.com'];
const CLOUD_ID_PATTERN = /^[A-Za-z0-9-]{8,100}$/;
const VALIDATION_REQUEST_ID = '00000000-0000-0000-0000-000000000000';
const STATUS_HINTS: Record<number, string> = {
    401: 'Check the connection credentials: the email and API token, or the alert API key.',
    403: 'This account or API key is not allowed to do this. Check its JSM Operations permissions.',
    404: 'Check that the alert, team or schedule exists and that the connection can see it.',
    429: 'JSM Operations is rate-limiting requests. Wait a moment and run the step again.',
};

type SendParams = {
    route: Route;
    method: HttpMethod;
    path: string;
    queryParams?: Record<string, string>;
    body?: unknown;
    timeout?: number;
};

type SiteParams = {
    route: AccountRoute;
    path: string;
    queryParams?: Record<string, string>;
};

type AlertLookup = {
    route: Route;
    alert: string | undefined;
    identifierType: AlertIdentifierType;
};

type AsyncParams = {
    route: Route;
    method: HttpMethod;
    path: string;
    queryParams?: Record<string, string>;
    body?: unknown;
    verb: string;
};

type AlertActionParams = {
    auth: JsmAuthValue;
    alert: string | undefined;
    identifierType: AlertIdentifierType;
    action: 'acknowledge' | 'close';
    note?: string;
    user?: string;
    source?: string;
};

type AccountAlertRequestParams = {
    auth: JsmAuthValue;
    feature: string;
    alert: string | undefined;
    identifierType: AlertIdentifierType;
    method: HttpMethod;
    suffix: string;
    body?: unknown;
    verb: string;
};

type ChangeTagsParams = {
    auth: JsmAuthValue;
    alert: string | undefined;
    identifierType: AlertIdentifierType;
    tags: unknown;
    operation: 'add' | 'remove';
};

type AddNoteParams = {
    auth: JsmAuthValue;
    alert: string | undefined;
    identifierType: AlertIdentifierType;
    note: string | undefined;
    user?: string;
    source?: string;
};

type WrappedRequestStatus = ApiRequestStatus & { data?: ApiRequestStatus };

type ValidationResult = { valid: true } | { valid: false; error: string };

export type NoteResult = RequestResult & {
    note_id: string | null;
    note: string | null;
};
