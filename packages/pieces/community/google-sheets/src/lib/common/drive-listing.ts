import { tryCatch } from '@activepieces/pieces-framework';
import { drive_v3 } from '@googleapis/drive';

const LIST_CALL_TIMEOUT_MS = 10_000;
const LISTING_BUDGET_MS = 25_000;
const SHARED_DRIVES_PAGE_SIZE = 100;
const SHARED_DRIVE_LIST_CONCURRENCY = 5;
const SAMPLE_MAX_PAGES = 10;
const LISTING_TIMED_OUT =
	'Google Drive took too long to list spreadsheets. Nothing was skipped; the next check will try again.';

function untilAborted<T>({ promise, signal }: { promise: Promise<T>; signal: AbortSignal }): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const onAbort = () => reject(new Error(LISTING_TIMED_OUT));
		if (signal.aborted) {
			onAbort();
		} else {
			signal.addEventListener('abort', onAbort, { once: true });
		}
		promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
	});
}

async function listCall<T>({
	deadline,
	call,
}: {
	deadline: number;
	call: (signal: AbortSignal) => Promise<T>;
}): Promise<T> {
	const ms = Math.min(LIST_CALL_TIMEOUT_MS, deadline - Date.now());
	if (ms <= 0) {
		throw new Error(LISTING_TIMED_OUT);
	}
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), ms);
	try {
		return await untilAborted({ promise: call(controller.signal), signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

async function listPages({
	drive,
	params,
	maxPages,
	deadline,
	accept,
}: {
	drive: drive_v3.Drive;
	params: drive_v3.Params$Resource$Files$List;
	maxPages: number | undefined;
	deadline: number;
	accept: FileFilter | undefined;
}): Promise<{ files: drive_v3.Schema$File[]; incomplete: boolean }> {
	const files: drive_v3.Schema$File[] = [];
	let pageToken: string | undefined = undefined;
	let pagesFetched = 0;
	do {
		const request: drive_v3.Params$Resource$Files$List = pageToken ? { ...params, pageToken } : params;
		const page: drive_v3.Schema$FileList = (
			await listCall({ deadline, call: (signal) => drive.files.list(request, { signal }) })
		).data;
		if (page.incompleteSearch) {
			return { files, incomplete: true };
		}
		files.push(...(page.files ?? []));
		pageToken = page.nextPageToken ?? undefined;
		pagesFetched += 1;
		if (maxPages && pagesFetched >= maxPages) {
			break;
		}
		if (accept && (files.some(accept) || Date.now() >= deadline)) {
			break;
		}
	} while (pageToken);
	return { files, incomplete: false };
}

function incompleteSearchError({ params }: { params: drive_v3.Params$Resource$Files$List }): Error {
	const scope = params.driveId ? `shared drive ${params.driveId}` : 'My Drive';
	return new Error(`Google Drive could not search every file in ${scope}. The next check will try again.`);
}

async function listCompleteCorpus({
	drive,
	params,
	maxPages,
	deadline,
	accept,
}: {
	drive: drive_v3.Drive;
	params: drive_v3.Params$Resource$Files$List;
	maxPages: number | undefined;
	deadline: number;
	accept: FileFilter | undefined;
}): Promise<drive_v3.Schema$File[]> {
	const result = await listPages({ drive, params, maxPages, deadline, accept });
	if (result.incomplete) {
		throw incompleteSearchError({ params });
	}
	return result.files;
}

async function listSharedDriveIds({
	drive,
	deadline,
}: {
	drive: drive_v3.Drive;
	deadline: number;
}): Promise<string[]> {
	const ids: string[] = [];
	let pageToken: string | undefined = undefined;
	do {
		const request: drive_v3.Params$Resource$Drives$List = {
			pageSize: SHARED_DRIVES_PAGE_SIZE,
			fields: 'nextPageToken, drives(id)',
			...(pageToken ? { pageToken } : {}),
		};
		const page: drive_v3.Schema$DriveList = (
			await listCall({ deadline, call: (signal) => drive.drives.list(request, { signal }) })
		).data;
		for (const sharedDrive of page.drives ?? []) {
			if (sharedDrive.id) {
				ids.push(sharedDrive.id);
			}
		}
		pageToken = page.nextPageToken ?? undefined;
	} while (pageToken);
	return ids;
}

async function listSharedDrivesFiles({
	drive,
	params,
	maxPages,
	deadline,
	driveIds,
	accept,
}: {
	drive: drive_v3.Drive;
	params: drive_v3.Params$Resource$Files$List;
	maxPages: number | undefined;
	deadline: number;
	driveIds: string[];
	accept: FileFilter | undefined;
}): Promise<DriveFileListing> {
	const files: drive_v3.Schema$File[] = [];
	const incompleteDrives: string[] = [];
	for (let index = 0; index < driveIds.length; index += SHARED_DRIVE_LIST_CONCURRENCY) {
		const batch = driveIds.slice(index, index + SHARED_DRIVE_LIST_CONCURRENCY);
		const results = await Promise.all(
			batch.map(async (driveId) => ({
				driveId,
				listing: await tryCatch(() =>
					listPages({
						drive,
						params: {
							...params,
							corpora: 'drive',
							driveId,
							includeItemsFromAllDrives: true,
							supportsAllDrives: true,
						},
						maxPages,
						deadline,
						accept,
					}),
				),
			})),
		);
		for (const { driveId, listing } of results) {
			if (listing.error) {
				console.warn(`[google-sheets] could not list shared drive ${driveId}; it will be retried on the next check.`, listing.error);
				incompleteDrives.push(driveId);
			} else if (listing.data.incomplete) {
				incompleteDrives.push(driveId);
			} else {
				files.push(...listing.data.files);
			}
		}
	}
	return { files, incompleteDrives };
}

function createdEpoch(file: drive_v3.Schema$File): number {
	const epoch = file.createdTime ? Date.parse(file.createdTime) : NaN;
	return Number.isNaN(epoch) ? 0 : epoch;
}

function mergeNewestFirst(files: drive_v3.Schema$File[]): drive_v3.Schema$File[] {
	const byId = new Map<string, drive_v3.Schema$File>();
	for (const file of files) {
		if (file.id && !byId.has(file.id)) {
			byId.set(file.id, file);
		}
	}
	return [...byId.values()].sort((a, b) => createdEpoch(b) - createdEpoch(a));
}

async function listFilesAcrossCorpora({
	drive,
	params,
	maxPages,
	accept,
}: {
	drive: drive_v3.Drive;
	params: drive_v3.Params$Resource$Files$List;
	maxPages: number | undefined;
	accept?: FileFilter;
}): Promise<DriveFileListing> {
	const deadline = Date.now() + LISTING_BUDGET_MS;
	const primary = await listPages({ drive, params, maxPages, deadline, accept });
	if (!primary.incomplete) {
		return { files: primary.files, incompleteDrives: [] };
	}
	if (params.corpora !== 'allDrives') {
		throw incompleteSearchError({ params });
	}
	const userFiles = await listCompleteCorpus({
		drive,
		params: { ...params, corpora: 'user' },
		maxPages,
		deadline,
		accept,
	});
	const driveIds = await listSharedDriveIds({ drive, deadline });
	const shared = await listSharedDrivesFiles({ drive, params, maxPages, deadline, driveIds, accept });
	return {
		files: mergeNewestFirst([...userFiles, ...shared.files]),
		incompleteDrives: shared.incompleteDrives,
	};
}

export const driveListing = {
	listFilesAcrossCorpora,
	listingBudgetMs: LISTING_BUDGET_MS,
	sampleMaxPages: SAMPLE_MAX_PAGES,
	listCallTimeoutMs: LIST_CALL_TIMEOUT_MS,
};

export type FileFilter = (file: drive_v3.Schema$File) => boolean;

export type DriveFileListing = {
	files: drive_v3.Schema$File[];
	incompleteDrives: string[];
};
