import { Client } from '@microsoft/microsoft-graph-client';

type GraphRetryOptions = {
	maxRetries?: number;
	initialDelayMs?: number;
	maxDelayMs?: number;
};

export const createGraphClient = (accessToken: string): Client => {
	return Client.initWithMiddleware({
		authProvider: {
			getAccessToken: () => Promise.resolve(accessToken),
		},
	});
};

const delay = async (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

const parseRetryAfterMs = (error: any): number | null => {
	const headers: Record<string, string> | undefined =
		error?.headers ?? error?.response?.headers ?? undefined;
	const retryAfter = headers?.['Retry-After'] ?? headers?.['retry-after'];
	if (!retryAfter) return null;
	const asNumber = Number(retryAfter);
	if (!Number.isNaN(asNumber)) return asNumber * 1000;
	// Retry-After can be HTTP-date; in that case, compute delta
	const retryDate = Date.parse(retryAfter);
	if (!Number.isNaN(retryDate)) {
		return Math.max(0, retryDate - Date.now());
	}
	return null;
};

const extractStatusCode = (error: any): number => {
	return (
		error?.statusCode ??
		error?.status ??
		error?.response?.status ??
		error?.response?.statusCode ??
		0
	);
};

const shouldRetry = (statusCode: number, code?: string): boolean => {
	// Retry on throttling and transient errors
	if (statusCode === 429 || statusCode === 503 || statusCode === 504) return true;
	// Some concurrency conflicts can be retried
	if (statusCode === 409) return true;
	// Optionally retry generic server errors
	if (statusCode >= 500 && statusCode < 600) return true;
	// Some SDKs surface codes like 'TooManyRequests'
	if (code && /too\s*many\s*requests/i.test(code)) return true;
	return false;
};

export const buildGraphErrorMessage = (error: any): string => {
	const status = extractStatusCode(error);
	const err = error?.body?.error ?? error?.error ?? {};
	const code = err?.code ?? error?.code;
	const message = err?.message ?? error?.message ?? 'Request failed';
	const inner = err?.innerError ?? err?.innererror ?? {};
	const requestId = inner?.['request-id'] ?? inner?.requestId ?? error?.requestId;
	return `Graph error (${status}${code ? ` ${code}` : ''})${requestId ? ` [request-id: ${requestId}]` : ''}: ${message}`;
};

export const withGraphRetry = async <T>(
	requestFn: () => Promise<T>,
	options: GraphRetryOptions = {}
): Promise<T> => {
	const maxRetries = options.maxRetries ?? 3;
	const initialDelayMs = options.initialDelayMs ?? 1000;
	const maxDelayMs = options.maxDelayMs ?? 10000;

	let attempt = 0;
	let delayMs = initialDelayMs;

	while (attempt <= maxRetries) {
		try {
			return await requestFn();
		} catch (e: any) {
			const status = extractStatusCode(e);
			const code = e?.body?.error?.code ?? e?.error?.code ?? e?.code;
			if (attempt < maxRetries && shouldRetry(status, code)) {
				const retryAfterMs = parseRetryAfterMs(e);
				await delay(Math.min(retryAfterMs ?? delayMs, maxDelayMs));
				attempt++;
				if (!retryAfterMs) {
					delayMs = Math.min(delayMs * 2, maxDelayMs);
				}
				continue;
			}
			throw new Error(buildGraphErrorMessage(e));
		}
	}
	throw new Error("Unexpected error occured");
};


