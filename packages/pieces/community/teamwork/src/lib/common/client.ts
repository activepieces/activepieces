import {
	AuthenticationType,
	httpClient,
	HttpMethod,
	QueryParams,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { teamworkAuth } from './auth';

const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 500;

export type TeamworkRequestOptions = {
	method: HttpMethod;
	path: string;
	body?: unknown;
	query?: QueryParams;
};

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
	auth: PiecePropValueSchema<typeof teamworkAuth>,
	options: TeamworkRequestOptions,
) {
	const base = `https://${auth.subdomain}.teamwork.com`;
	const url = buildUrl(base, options.path, options.query);

	let attempt = 0;
	let delay = INITIAL_DELAY_MS;
	let retrying = true;
	while (retrying) {
		try {
			const res = await httpClient.sendRequest({
				method: options.method,
				url,
				headers: { 'Content-Type': 'application/json' },
				body: options.body,
				authentication: {
					type: AuthenticationType.BASIC,
					username: auth.username,
					password: auth.password,
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
			} else {
				retrying = false;
				throw e;
			}
		}
	}
	throw new Error('Teamwork request failed after multiple retries.');
}

export function normalizeResponse(data: any) {
	if (!data || typeof data !== 'object') {
		return { success: true, data };
	}
	// Common Teamwork entities include id and link
	const id =
		data.id ||
		data.todoItemId ||
		data.task?.id ||
		data.company?.id ||
		data.project?.id ||
		data.message?.id ||
		data.file?.id;
	const url = data['link'] || data['url'] || data?.task?.link || data?.project?.link;
	return { success: true, id, url, data };
}


