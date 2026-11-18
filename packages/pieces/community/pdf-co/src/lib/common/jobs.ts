import { HttpMethod } from '@activepieces/pieces-common';
import { pdfCoClient } from './client';
import { FlowFiles, pdfCoFiles } from './files';

const POLL_DELAYS_MS = [3_000, 5_000, 10_000, 15_000, 20_000];
const MAX_POLL_DELAY_MS = 30_000;
const JOB_CHECK_TIMEOUT_MS = 20_000;

function pollDelay(attempt: number): number {
	return POLL_DELAYS_MS[attempt] ?? MAX_POLL_DELAY_MS;
}

function stringOrUndefined(value: unknown): string | undefined {
	return typeof value === 'string' && value !== '' ? value : undefined;
}

function numberOrUndefined(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function stringList(value: unknown): string[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	return value.filter((item): item is string => typeof item === 'string' && item !== '');
}

async function checkJob({ apiKey, jobId }: { apiKey: string; jobId: string }): Promise<Record<string, unknown>> {
	const body = await pdfCoClient.request<unknown>({
		apiKey,
		method: HttpMethod.POST,
		path: '/v1/job/check',
		body: { jobid: jobId },
		timeoutMs: JOB_CHECK_TIMEOUT_MS,
	});
	return pdfCoClient.readRecord(body);
}

function assertNotFailed({ check, jobId }: { check: Record<string, unknown>; jobId: string }): void {
	const status = check['status'];
	if (status === 'failed' || status === 'aborted') {
		const message = stringOrUndefined(check['message']) ?? 'no reason given';
		throw new Error(`PDF.co background job ${jobId} ${status}: ${message}`);
	}
}

async function runJob({
	apiKey,
	path,
	body,
	background,
	pollCeilingMs = DEFAULT_POLL_CEILING_MS,
	alwaysAsync = false,
}: {
	apiKey: string;
	path: string;
	body: Record<string, unknown>;
	background: boolean;
	pollCeilingMs?: number;
	alwaysAsync?: boolean;
}): Promise<JobResult> {
	const useAsync = background || alwaysAsync;
	const initial = pdfCoClient.readRecord(
		await pdfCoClient.request<unknown>({
			apiKey,
			method: HttpMethod.POST,
			path,
			body: { ...body, async: useAsync },
		}),
	);
	if (!useAsync) {
		return { body: initial, status: 'success' };
	}
	const jobId = stringOrUndefined(initial['jobId']);
	if (jobId === undefined) {
		throw new Error('PDF.co did not return a job ID for the background job.');
	}
	return waitForJob({ apiKey, jobId, initial, pollCeilingMs, checkImmediately: false });
}

async function waitForJob({
	apiKey,
	jobId,
	initial = {},
	pollCeilingMs = DEFAULT_POLL_CEILING_MS,
	checkImmediately,
}: {
	apiKey: string;
	jobId: string;
	initial?: Record<string, unknown>;
	pollCeilingMs?: number;
	checkImmediately: boolean;
}): Promise<JobResult> {
	const deadline = Date.now() + pollCeilingMs;
	let credits = numberOrUndefined(initial['credits']);
	let remaining = numberOrUndefined(initial['remainingCredits']);
	for (let attempt = 0; ; attempt++) {
		const delay = checkImmediately && attempt === 0 ? 0 : pollDelay(checkImmediately ? attempt - 1 : attempt);
		if (Date.now() + delay > deadline) {
			break;
		}
		if (delay > 0) {
			await pdfCoClient.sleep(delay);
		}
		const check = await checkJob({ apiKey, jobId });
		assertNotFailed({ check, jobId });
		credits = addCredits({ total: credits, value: check['credits'] });
		remaining = numberOrUndefined(check['remainingCredits']) ?? remaining;
		if (check['status'] === 'success') {
			return { body: { ...initial, ...check, ...creditFields({ credits, remaining }) }, status: 'success', jobId };
		}
	}
	return { body: { ...initial, ...creditFields({ credits, remaining }) }, status: 'working', jobId };
}

function addCredits({ total, value }: { total: number | undefined; value: unknown }): number | undefined {
	const extra = numberOrUndefined(value);
	if (extra === undefined) {
		return total;
	}
	return (total ?? 0) + extra;
}

function creditFields({ credits, remaining }: { credits: number | undefined; remaining: number | undefined }): Record<string, number> {
	return {
		...(credits === undefined ? {} : { credits }),
		...(remaining === undefined ? {} : { remainingCredits: remaining }),
	};
}

async function resultUrls({ result }: { result: JobResult }): Promise<string[] | undefined> {
	const direct = stringList(result.body['urls']);
	if (direct !== undefined) {
		return direct;
	}
	const listed = result.jobId === undefined ? undefined : stringList(result.body['body']);
	if (listed !== undefined && listed.length > 0) {
		return listed;
	}
	const url = stringOrUndefined(result.body['url']);
	if (result.status !== 'success' || result.jobId === undefined || url === undefined || !/\.json(\?|$)/i.test(url)) {
		return undefined;
	}
	const parsed = await pdfCoFiles.readStorageJson({ url });
	return isLinkList(parsed) ? parsed : undefined;
}

function isLinkList(value: unknown): value is string[] {
	return Array.isArray(value) && value.length > 0 && value.every((item) => typeof item === 'string' && item.startsWith('https://'));
}

async function saveAll({
	files,
	targets,
	fileName,
}: {
	files: FlowFiles;
	targets: string[];
	fileName?: string;
}): Promise<{ saved: (string | null)[]; error?: string }> {
	const results = await Promise.allSettled(
		targets.map((target) => pdfCoFiles.saveToFlow({ files, url: target, fileName: targets.length === 1 ? fileName : undefined })),
	);
	const saved = results.map((result) => (result.status === 'fulfilled' ? result.value : null));
	const failures = results.flatMap((result, index) => (result.status === 'rejected' ? [{ index, reason: result.reason }] : []));
	if (failures.length === 0) {
		return { saved };
	}
	const first = failures[0].reason instanceof Error ? failures[0].reason.message : String(failures[0].reason);
	if (targets.length === 1) {
		return { saved, error: `The result was created but could not be saved as a file: ${first}. Use the link instead.` };
	}
	const parts = failures.map((failure) => failure.index + 1).join(', ');
	return {
		saved,
		error: `${failures.length} of ${targets.length} results could not be saved as files (part ${parts}): ${first}. Use the links instead.`,
	};
}

async function buildFileOutput({
	result,
	files,
	saveOutputFile,
	multiOutput = false,
	fileName,
}: {
	result: JobResult;
	files: FlowFiles;
	saveOutputFile: boolean;
	multiOutput?: boolean;
	fileName?: string;
}): Promise<FileActionOutput> {
	const body = result.body;
	const url = stringOrUndefined(body['url']);
	const urls = multiOutput ? await resultUrls({ result }) : undefined;
	const base: FileActionOutput = {
		status: result.status,
		job_id: result.jobId,
		url: multiOutput && urls !== undefined ? urls[0] : url,
		urls,
		name: stringOrUndefined(body['name']),
		page_count: numberOrUndefined(body['pageCount']),
		file_size: numberOrUndefined(body['fileSize']),
		credits_used: numberOrUndefined(body['credits']),
		remaining_credits: numberOrUndefined(body['remainingCredits']),
		link_valid_until: stringOrUndefined(body['outputLinkValidTill']),
		duration_ms: numberOrUndefined(body['duration']),
	};
	if (!saveOutputFile || result.status !== 'success') {
		return base;
	}
	const single = url === undefined ? [] : [url];
	const targets = multiOutput ? urls ?? single : single;
	if (targets.length === 0) {
		return base;
	}
	const saved = await saveAll({ files, targets, fileName });
	return { ...base, ...savedFileFields({ ...saved, multiOutput }) };
}

function savedFileFields({
	saved,
	error,
	multiOutput,
}: {
	saved: (string | null)[];
	error?: string;
	multiOutput: boolean;
}): Pick<FileActionOutput, 'file' | 'files' | 'file_error'> {
	const first = saved[0];
	const anySaved = saved.some((entry) => entry !== null);
	return {
		...(first === null || first === undefined ? {} : { file: first }),
		...(multiOutput && anySaved ? { files: saved } : {}),
		...(error === undefined ? {} : { file_error: error }),
	};
}

function optionalText(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

function validateExpiration(expiration: unknown): number | undefined {
	if (expiration === undefined || expiration === null || expiration === '') {
		return undefined;
	}
	const value = Number(expiration);
	if (!Number.isInteger(value) || value <= 0) {
		throw new Error('Link Expiration must be a whole number of minutes greater than 0.');
	}
	return value;
}

function commonBody({
	outputName,
	expiration,
	pdfPassword,
	httpUsername,
	httpPassword,
}: CommonBodyInput): Record<string, unknown> {
	const minutes = validateExpiration(expiration);
	return {
		...(optionalText(outputName) === undefined ? {} : { name: outputName }),
		...(minutes === undefined ? {} : { expiration: minutes }),
		...(optionalText(pdfPassword) === undefined ? {} : { password: pdfPassword }),
		...(optionalText(httpUsername) === undefined ? {} : { httpusername: httpUsername }),
		...(optionalText(httpPassword) === undefined ? {} : { httppassword: httpPassword }),
	};
}

async function runFileAction({
	apiKey,
	files,
	path,
	body,
	common,
	multiOutput = false,
}: {
	apiKey: string;
	files: FlowFiles;
	path: string;
	body: Record<string, unknown>;
	common: CommonBodyInput & { runInBackground?: unknown; saveOutputFile?: unknown };
	multiOutput?: boolean;
}): Promise<FileActionOutput> {
	const request = { ...commonBody(common), ...body };
	const result = await runJob({ apiKey, path, body: request, background: common.runInBackground === true });
	return buildFileOutput({
		result,
		files,
		saveOutputFile: common.saveOutputFile === true,
		multiOutput,
		fileName: optionalText(common.outputName),
	});
}

async function runInline({
	apiKey,
	path,
	body,
	common,
}: {
	apiKey: string;
	path: string;
	body: Record<string, unknown>;
	common: CommonBodyInput;
}): Promise<Record<string, unknown>> {
	const result = await runJob({
		apiKey,
		path,
		body: { ...commonBody({ pdfPassword: common.pdfPassword, httpUsername: common.httpUsername, httpPassword: common.httpPassword }), ...body },
		background: false,
	});
	return result.body;
}

async function optionalSave({
	files,
	url,
	enabled,
	fileName,
}: {
	files: FlowFiles;
	url: unknown;
	enabled: unknown;
	fileName?: unknown;
}): Promise<{ file?: string; file_error?: string }> {
	if (enabled !== true || typeof url !== 'string' || url === '') {
		return {};
	}
	try {
		return { file: await pdfCoFiles.saveToFlow({ files, url, fileName: optionalText(fileName) }) };
	} catch (error) {
		const reason = error instanceof Error ? error.message : String(error);
		return { file_error: `The result was created but could not be saved as a file: ${reason}. Use the link instead.` };
	}
}

async function legacyEditOutput({
	body,
	files,
	saveOutputFile,
	fileName,
}: {
	body: Record<string, unknown>;
	files: FlowFiles;
	saveOutputFile: unknown;
	fileName: unknown;
}): Promise<Record<string, unknown>> {
	const saved = await optionalSave({ files, url: body['url'], enabled: saveOutputFile, fileName });
	return {
		outputUrl: body['url'],
		pageCount: body['pageCount'],
		outputName: body['name'],
		creditsUsed: body['credits'],
		remainingCredits: body['remainingCredits'],
		...saved,
	};
}

export const pdfCoJobs = {
	runJob,
	waitForJob,
	saveAll,
	savedFileFields,
	stringList,
	checkJob,
	assertNotFailed,
	buildFileOutput,
	resultUrls,
	commonBody,
	validateExpiration,
	runFileAction,
	runInline,
	optionalSave,
	legacyEditOutput,
};

export const DEFAULT_POLL_CEILING_MS = 240_000;

export type CommonBodyInput = {
	outputName?: unknown;
	expiration?: unknown;
	pdfPassword?: unknown;
	httpUsername?: unknown;
	httpPassword?: unknown;
};

export type JobResult = {
	body: Record<string, unknown>;
	status: 'success' | 'working';
	jobId?: string;
};

export type FileActionOutput = {
	status: 'success' | 'working';
	job_id?: string;
	url?: string;
	urls?: string[];
	name?: string;
	page_count?: number;
	file_size?: number;
	credits_used?: number;
	remaining_credits?: number;
	link_valid_until?: string;
	duration_ms?: number;
	file?: string;
	files?: (string | null)[];
	file_error?: string;
};
