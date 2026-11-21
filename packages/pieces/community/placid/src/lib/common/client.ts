import { AuthenticationType, HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, isNil } from '@activepieces/pieces-framework';
import { placidAuth } from '../auth';
import {
	PLACID_BASE_URL,
	PlacidCollection,
	PlacidCreateImageRequest,
	PlacidCreatePdfRequest,
	PlacidCreateVideoRequest,
	PlacidLayers,
	PlacidLayerValues,
	PlacidRender,
	PlacidRenderType,
	PlacidTemplate,
	PlacidTemplatePart,
} from './index';

const POLL_INTERVAL_MS = 5000;
const POLL_DEADLINE_MS = 5 * 60 * 1000;
const DROPDOWN_TEMPLATE_CAP = 500;

const RENDER_PATHS: Record<PlacidRenderType, string> = {
	image: 'images',
	pdf: 'pdfs',
	video: 'videos',
};

const RENDER_LABELS: Record<PlacidRenderType, string> = {
	image: 'Image',
	pdf: 'PDF',
	video: 'Video',
};

export class PlacidApiError extends Error {
	readonly status: number | null;
	readonly responseBody: unknown;

	constructor({ message, status, responseBody }: { message: string; status: number | null; responseBody: unknown }) {
		super(message);
		this.name = 'PlacidApiError';
		this.status = status;
		this.responseBody = responseBody;
	}
}

function readHttpFailure(error: unknown): { status: number; body: unknown } | null {
	if (typeof error !== 'object' || error === null || !('response' in error)) {
		return null;
	}
	const response = error.response;
	if (typeof response !== 'object' || response === null || !('status' in response)) {
		return null;
	}
	const status = response.status;
	if (typeof status !== 'number' || status === 0) {
		return null;
	}
	return { status, body: 'body' in response ? response.body : undefined };
}

function vendorMessage(body: unknown): string | null {
	if (typeof body === 'string' && body.trim().length > 0) {
		return body.length > 300 ? `${body.slice(0, 300)}…` : body;
	}
	if (typeof body !== 'object' || body === null) {
		return null;
	}
	if ('message' in body && typeof body.message === 'string') {
		const fieldErrors = 'errors' in body ? describeFieldErrors(body.errors) : '';
		return fieldErrors ? `${body.message} ${fieldErrors}` : body.message;
	}
	if ('error' in body && typeof body.error === 'string') {
		return body.error;
	}
	return null;
}

function describeFieldErrors(errors: unknown): string {
	if (typeof errors !== 'object' || errors === null || Array.isArray(errors)) {
		return '';
	}
	return Object.entries(errors)
		.map(([field, messages]) => {
			const first = Array.isArray(messages) ? messages.find((message) => typeof message === 'string') : messages;
			return typeof first === 'string' ? `${field}: ${first}` : '';
		})
		.filter((line) => line.length > 0)
		.join('; ');
}

function describeStatus(status: number): string {
	if (status === 401) return 'the API token is invalid or was revoked';
	if (status === 403) return 'access is forbidden for this API token';
	if (status === 404) return 'not found';
	if (status === 413) return 'the file is too large';
	if (status === 422) return 'the request was rejected as invalid';
	if (status === 429) return 'the rate limit (60 requests per minute) was exceeded, try again shortly';
	if (status >= 500) return 'Placid had a server error, try again later';
	return `request failed with HTTP ${status}`;
}

function toPlacidError({ error, operation, mayHaveApplied }: { error: unknown; operation: string; mayHaveApplied: boolean }): PlacidApiError {
	if (error instanceof PlacidApiError) {
		return error;
	}
	const failure = readHttpFailure(error);
	if (failure) {
		const detail = vendorMessage(failure.body);
		return new PlacidApiError({
			message: `Placid ${operation} failed: ${describeStatus(failure.status)}${detail ? ` (${detail})` : ''}.`,
			status: failure.status,
			responseBody: failure.body,
		});
	}
	const reason = error instanceof Error ? error.message : String(error);
	const suffix = mayHaveApplied ? ' The request may still have been applied on Placid; check before retrying.' : '';
	return new PlacidApiError({
		message: `Placid ${operation} failed: network error (${reason}).${suffix}`,
		status: null,
		responseBody: null,
	});
}

function isTransient(error: unknown): boolean {
	if (!(error instanceof PlacidApiError)) {
		return true;
	}
	return error.status === null || error.status === 429 || error.status >= 500;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJsonInput({ value, field }: { value: unknown; field: string }): unknown {
	if (typeof value !== 'string') {
		return value;
	}
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return undefined;
	}
	try {
		return JSON.parse(trimmed);
	} catch {
		throw new Error(`${field} must be valid JSON.`);
	}
}

function parseLayers({ value, field }: { value: unknown; field: string }): PlacidLayers | undefined {
	const parsed = parseJsonInput({ value, field });
	if (isNil(parsed)) {
		return undefined;
	}
	if (!isPlainObject(parsed)) {
		throw new Error(`${field} must be a JSON object keyed by layer name, e.g. {"title": {"text": "Hello"}}.`);
	}
	const layers: PlacidLayers = {};
	for (const [name, fields] of Object.entries(parsed)) {
		if (!isPlainObject(fields)) {
			throw new Error(`${field}: layer "${name}" must be an object of layer properties, e.g. {"text": "Hello"} or {"image": "https://..."}.`);
		}
		layers[name] = fields;
	}
	return Object.keys(layers).length > 0 ? layers : undefined;
}

function parseTemplateParts({ value, field }: { value: unknown; field: string }): PlacidTemplatePart[] {
	const top = parseJsonInput({ value, field });
	const parsed = Array.isArray(top)
		? top.flatMap((item) => {
				const entry = parseJsonInput({ value: item, field });
				return Array.isArray(entry) ? entry : [entry];
			})
		: top;
	if (!Array.isArray(parsed) || parsed.length === 0) {
		throw new Error(`${field} must be a non-empty list of {"template_uuid": "...", "layers": {...}} objects.`);
	}
	return parsed.map((item, index) => {
		if (!isPlainObject(item)) {
			throw new Error(`${field}[${index}] must be an object with template_uuid and layers.`);
		}
		const templateUuid = item['template_uuid'];
		if (typeof templateUuid !== 'string' || templateUuid.trim().length === 0) {
			throw new Error(`${field}[${index}].template_uuid is required.`);
		}
		const layers = parseLayers({ value: item['layers'], field: `${field}[${index}].layers` });
		return { template_uuid: templateUuid.trim(), ...(layers ? { layers } : {}) };
	});
}

function flattenDynamicLayers(values: Record<string, unknown> | undefined): PlacidLayers | undefined {
	if (!values) {
		return undefined;
	}
	const entries = Object.entries(values).filter(([key, value]) => {
		const [layer, field] = key.split(':::');
		return Boolean(layer) && Boolean(field) && value !== '' && !isNil(value);
	});
	if (entries.length === 0) {
		return undefined;
	}
	return entries.reduce<PlacidLayers>((layers, [key, value]) => {
		const [layer, field] = key.split(':::');
		const existing: PlacidLayerValues = layers[layer] ?? {};
		return { ...layers, [layer]: { ...existing, [field]: value } };
	}, {});
}

function toCreateNow(waitForResult: string | undefined): boolean {
	return waitForResult !== 'no';
}

export class PlacidClient {
	constructor(private apiKey: AppConnectionValueForAuthProperty<typeof placidAuth>) {}

	private async send<T>({
		method,
		url,
		body,
		queryParams,
		operation,
	}: {
		method: HttpMethod;
		url: string;
		body?: unknown;
		queryParams?: QueryParams;
		operation: string;
	}): Promise<T> {
		try {
			const response = await httpClient.sendRequest<T>({
				method,
				url,
				body,
				queryParams,
				headers: { Accept: 'application/json' },
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: this.apiKey.secret_text,
				},
			});
			return response.body;
		} catch (error) {
			throw toPlacidError({ error, operation, mayHaveApplied: method !== HttpMethod.GET });
		}
	}

	async listTemplatePage({
		url,
		queryParams,
	}: {
		url?: string;
		queryParams?: QueryParams;
	}): Promise<{ data: PlacidTemplate[]; next: string | null }> {
		const body = await this.send<{ data?: PlacidTemplate[]; links?: { next?: string | null } }>({
			method: HttpMethod.GET,
			url: url ?? `${PLACID_BASE_URL}/templates`,
			queryParams: url ? undefined : queryParams,
			operation: 'list templates',
		});
		return { data: body.data ?? [], next: body.links?.next ?? null };
	}

	async listTemplates(): Promise<{ templates: PlacidTemplate[]; truncated: boolean }> {
		const templates: PlacidTemplate[] = [];
		let page = await this.listTemplatePage({});
		templates.push(...page.data);
		while (page.next && templates.length < DROPDOWN_TEMPLATE_CAP) {
			page = await this.listTemplatePage({ url: page.next });
			templates.push(...page.data);
		}
		return { templates: templates.slice(0, DROPDOWN_TEMPLATE_CAP), truncated: Boolean(page.next) || templates.length > DROPDOWN_TEMPLATE_CAP };
	}

	async getTemplate(templateId: string): Promise<PlacidTemplate> {
		return this.send<PlacidTemplate>({
			method: HttpMethod.GET,
			url: `${PLACID_BASE_URL}/templates/${encodeURIComponent(templateId)}`,
			operation: `get template ${templateId}`,
		});
	}

	async listCollections(): Promise<PlacidCollection[]> {
		const body = await this.send<PlacidCollection[] | { data?: PlacidCollection[] }>({
			method: HttpMethod.GET,
			url: `${PLACID_BASE_URL}/collections`,
			operation: 'list collections',
		});
		return Array.isArray(body) ? body : body.data ?? [];
	}

	async createImage(request: PlacidCreateImageRequest): Promise<PlacidRender> {
		return this.createRender({ type: 'image', body: request, wait: request.create_now === true });
	}

	async createPdf(request: PlacidCreatePdfRequest): Promise<PlacidRender> {
		return this.createRender({ type: 'pdf', body: request, wait: request.create_now === true });
	}

	async createVideo(request: PlacidCreateVideoRequest): Promise<PlacidRender> {
		return this.createRender({ type: 'video', body: request, wait: request.create_now === true });
	}

	private async createRender({ type, body, wait }: { type: PlacidRenderType; body: unknown; wait: boolean }): Promise<PlacidRender> {
		const result = await this.send<PlacidRender>({
			method: HttpMethod.POST,
			url: `${PLACID_BASE_URL}/${RENDER_PATHS[type]}`,
			body,
			operation: `create ${type}`,
		});
		if (result.status === 'error') {
			throw renderFailed({ type, render: result });
		}
		if (wait && result.status === 'queued') {
			return this.pollForCompletion({ id: String(result.id), type });
		}
		return result;
	}

	async getRender({ id, type }: { id: string; type: PlacidRenderType }): Promise<PlacidRender> {
		try {
			return await this.send<PlacidRender>({
				method: HttpMethod.GET,
				url: `${PLACID_BASE_URL}/${RENDER_PATHS[type]}/${encodeURIComponent(id)}`,
				operation: `get ${type} ${id}`,
			});
		} catch (error) {
			if (error instanceof PlacidApiError && error.status === 404) {
				throw new PlacidApiError({
					message: `${RENDER_LABELS[type]} with ID ${id} was not found in this Placid project. It may have been deleted or belong to another project.`,
					status: 404,
					responseBody: error.responseBody,
				});
			}
			throw error;
		}
	}

	async getImage(id: string): Promise<PlacidRender> {
		return this.getRender({ id, type: 'image' });
	}

	async getPdf(id: string): Promise<PlacidRender> {
		return this.getRender({ id, type: 'pdf' });
	}

	async getVideo(id: string): Promise<PlacidRender> {
		return this.getRender({ id, type: 'video' });
	}

	async deleteRender({ id, type }: { id: string; type: PlacidRenderType }): Promise<{ deleted: true; id: string }> {
		try {
			await this.send<unknown>({
				method: HttpMethod.DELETE,
				url: `${PLACID_BASE_URL}/${RENDER_PATHS[type]}/${encodeURIComponent(id)}`,
				operation: `delete ${type} ${id}`,
			});
		} catch (error) {
			if (error instanceof PlacidApiError && error.status === 404) {
				return { deleted: true, id };
			}
			throw error;
		}
		return { deleted: true, id };
	}

	async pollForCompletion({ id, type }: { id: string; type: PlacidRenderType }): Promise<PlacidRender> {
		const deadline = Date.now() + POLL_DEADLINE_MS;
		let latest: PlacidRender | null = null;
		let lastTransient: unknown = null;
		while (Date.now() < deadline) {
			await sleep(POLL_INTERVAL_MS);
			try {
				latest = await this.getRender({ id, type });
				lastTransient = null;
			} catch (error) {
				if (!isTransient(error)) {
					throw error;
				}
				lastTransient = error;
				continue;
			}
			if (latest.status === 'finished') {
				return latest;
			}
			if (latest.status === 'error') {
				throw renderFailed({ type, render: latest });
			}
		}
		if (latest) {
			return latest;
		}
		throw toPlacidError({ error: lastTransient, operation: `get ${type} ${id}`, mayHaveApplied: false });
	}
}

function renderFailed({ type, render }: { type: PlacidRenderType; render: PlacidRender }): PlacidApiError {
	const details = (render.error_details ?? [])
		.map((detail) => [detail.layer, detail.message].filter(Boolean).join(': '))
		.filter((line) => line.length > 0)
		.join('; ');
	const reason = render.error_message ?? render.error_code ?? 'unknown error';
	return new PlacidApiError({
		message: `Placid ${type} ${render.id} failed to render: ${reason}${details ? ` (${details})` : ''}.`,
		status: null,
		responseBody: render,
	});
}

async function assertLayersExist({ client, parts }: { client: PlacidClient; parts: PlacidTemplatePart[] }): Promise<void> {
	const uuids = [...new Set(parts.map((part) => part.template_uuid))];
	const templates = new Map<string, PlacidTemplate>();
	for (const uuid of uuids) {
		templates.set(uuid, await client.getTemplate(uuid));
	}
	for (const part of parts) {
		const template = templates.get(part.template_uuid);
		if (!template || !part.layers) {
			continue;
		}
		const templateLayers = template.layers ?? [];
		const valid = new Set(templateLayers.map((layer) => layer.name));
		const unknown = Object.keys(part.layers).filter((name) => !valid.has(name));
		if (unknown.length > 0) {
			const list = templateLayers.map((layer) => `${layer.name} (${layer.type})`).join(', ');
			throw new Error(
				`Template ${part.template_uuid} has no layer named ${unknown.map((name) => `"${name}"`).join(', ')}. Valid layers: ${list || 'none'}.`,
			);
		}
	}
}

export const placidHelpers = {
	parseLayers,
	parseTemplateParts,
	flattenDynamicLayers,
	assertLayersExist,
	toCreateNow,
	isPlainObject,
	toPlacidError,
};
