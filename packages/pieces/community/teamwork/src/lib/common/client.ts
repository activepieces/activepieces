import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import type { TeamworkAuth } from './auth';

const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 500;

export type TeamworkRequestOptions = {
	method: HttpMethod;
	path: string;
	body?: unknown;
	query?: Record<string, string | number | boolean | undefined>;
};

export function resolveCredentials(auth: unknown): { apiKey: string; subdomain: string } {
	const a = auth as { apiKey?: string; subdomain?: string } | undefined;
	const apiKey = a?.apiKey || process.env.TEAMWORK_API_KEY;
	const subdomain = a?.subdomain || process.env.TEAMWORK_SUBDOMAIN;
	if (!apiKey || !subdomain) {
		throw new Error('Missing Teamwork credentials: API key or subdomain');
	}
	return { apiKey, subdomain };
}

function buildUrl(base: string, path: string, query?: TeamworkRequestOptions['query']): string {
	const url = new URL(path.startsWith('http') ? path : `${base}${path}`);
	if (query) {
		Object.entries(query)
			.filter(([, v]) => v !== undefined)
			.forEach(([k, v]) => url.searchParams.set(k, String(v)));
	}
	return url.toString();
}

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function teamworkRequest(
	auth: TeamworkAuth | unknown,
	options: TeamworkRequestOptions
) {
	const { apiKey, subdomain } = resolveCredentials(auth);
	const base = `https://${subdomain}.teamwork.com`;
	const url = buildUrl(base, options.path, options.query);

	let attempt = 0;
	let delay = INITIAL_DELAY_MS;
	while (true) {
		try {
			const res = await httpClient.sendRequest({
				method: options.method,
				url,
				headers: { 'Content-Type': 'application/json' },
				body: options.body,
				authentication: {
					type: AuthenticationType.BASIC,
					username: apiKey,
					password: 'x',
				},
			});
			return normalizeResponse(res.body);
		} catch (e: any) {
			const status: number | undefined = e?.response?.status;
			if (status && (status === 429 || (status >= 500 && status < 600)) && attempt < MAX_RETRIES) {
				const retryAfter = Number(e?.response?.headers?.['retry-after']);
				await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : delay);
				attempt++;
				delay = Math.min(delay * 2, 8000);
				continue;
			}
			throw e;
		}
	}
}

export function normalizeResponse(data: any) {
	if (!data || typeof data !== 'object') {
		return { success: true, data };
	}
	// Common Teamwork entities include id and link
	const id = data.id || data.todoItemId || data.task?.id || data.company?.id || data.project?.id || data.message?.id || data.file?.id;
	const url = data['link'] || data['url'] || data?.task?.link || data?.project?.link;
	return { success: true, id, url, data };
}


