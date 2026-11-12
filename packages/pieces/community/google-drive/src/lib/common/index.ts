import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Property, tryCatch } from '@activepieces/pieces-framework';
import { drive as googleDrive, drive_v3 } from '@googleapis/drive';
import { googleDriveAuth, GoogleDriveAuthValue, getAccessToken, createGoogleClient } from '../auth';
import { driveDeadline } from './deadline';
import { drivePool } from './pool';

const FOLDER_DROPDOWN_PAGE_SIZE = 1000;
const SHARED_DRIVES_PAGE_SIZE = 100;
const SHARED_DRIVE_LIST_CONCURRENCY = 5;
const LIST_CALL_TIMEOUT_MS = 10_000;
const LISTING_BUDGET_MS = 25_000;
const TEST_SAMPLE_MAX_PAGES = 10;
const LISTING_TIMED_OUT =
  'Google Drive took too long to list files. Nothing was skipped; the next check will try again.';
const ACTION_LISTING_BUDGET_MS = 120_000;
const ACTION_LISTING_TIMED_OUT =
  'Google Drive took too long to search. Try again, or narrow the search.';
const WATCH_FOLDER_HINT =
  'Leave empty to watch My Drive and files shared with you. Shared drives are watched only when Include Team Drives is on. Type to search by folder name.';

const escapeDriveQueryLiteral = (value: string): string =>
  value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

async function fetchFolderDropdownOptions({
  auth,
  searchValue,
  includeTeamDrives,
}: {
  auth: GoogleDriveAuthValue | undefined;
  searchValue: string | undefined;
  includeTeamDrives: boolean | undefined;
}) {
  if (!auth) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Connect your Google account first',
    };
  }
  const accessToken = await getAccessToken(auth);
  const trimmedSearchValue = searchValue?.trim() ?? '';
  const qParts = [
    "mimeType='application/vnd.google-apps.folder'",
    'trashed = false',
  ];
  if (trimmedSearchValue.length > 0) {
    qParts.push(`name contains '${escapeDriveQueryLiteral(trimmedSearchValue)}'`);
  }
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `https://www.googleapis.com/drive/v3/files`,
    queryParams: {
      q: qParts.join(' and '),
      includeItemsFromAllDrives: includeTeamDrives ? 'true' : 'false',
      supportsAllDrives: 'true',
      corpora: includeTeamDrives ? 'allDrives' : 'user',
      pageSize: String(FOLDER_DROPDOWN_PAGE_SIZE),
      fields: 'nextPageToken, files(id, name)',
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  };
  let folders: { id: string; name: string }[] = [];
  let truncated = false;
  try {
    const response = await httpClient.sendRequest<{
      files: { id: string; name: string }[];
      nextPageToken?: string;
    }>(request);
    folders = response.body.files ?? [];
    truncated = Boolean(response.body.nextPageToken);
  } catch (e) {
    throw new Error(`Failed to get folders\nError:${e}`);
  }

  return {
    disabled: false,
    placeholder: truncated
      ? `Showing the first ${folders.length} matches. Type to narrow the list, or paste an ID with Dynamic value.`
      : undefined,
    options: folders.map((folder: { id: string; name: string }) => {
      return {
        label: folder.name,
        value: folder.id,
      };
    }),
  };
}

function timedOutMessage(wording: ListingWording): string {
  return wording === 'action' ? ACTION_LISTING_TIMED_OUT : LISTING_TIMED_OUT;
}

function listCall<T>({
  deadline,
  wording,
  call,
}: {
  deadline: number;
  wording: ListingWording;
  call: (signal: AbortSignal) => Promise<T>;
}): Promise<T> {
  return driveDeadline.runWithin({
    ms:
      wording === 'poll'
        ? Math.min(LIST_CALL_TIMEOUT_MS, deadline - Date.now())
        : deadline - Date.now(),
    message: timedOutMessage(wording),
    call,
  });
}

async function listPages({
  drive,
  params,
  maxPages,
  deadline,
  wording,
  stopAt,
  startToken,
  accept,
}: {
  drive: drive_v3.Drive;
  params: drive_v3.Params$Resource$Files$List;
  maxPages: number | undefined;
  deadline: number;
  wording: ListingWording;
  stopAt: ListingStop | undefined;
  startToken?: string;
  accept?: FileAccept;
}): Promise<PageListing> {
  const files: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined = startToken;
  let pagesFetched = 0;
  let closingKey: number | undefined = undefined;
  do {
    const sampling = accept !== undefined && pagesFetched > 0;
    if (sampling && Date.now() >= deadline) {
      break;
    }
    const canStop = stopAt !== undefined && pagesFetched > 0;
    if (canStop) {
      const lastKey = lastReadKey({
        listing: { files, incomplete: false, truncated: true },
        orderBy: params.orderBy,
      });
      if (Date.now() >= deadline) {
        return { files, incomplete: false, truncated: true, nextPageToken: pageToken };
      }
      if (closingKey === undefined && files.length >= stopAt.maxFiles) {
        closingKey = lastKey;
      }
      if (closingKey !== undefined && lastKey !== closingKey) {
        return { files, incomplete: false, truncated: true, nextPageToken: pageToken };
      }
    }
    const request: drive_v3.Params$Resource$Files$List = pageToken
      ? { ...params, pageToken }
      : params;
    const page: drive_v3.Schema$FileList | undefined = await listCall({
      deadline,
      wording,
      call: (signal) => drive.files.list(request, { signal }),
    }).then(
      (response) => response.data,
      (error: unknown) => {
        if ((canStop || sampling) && Date.now() >= deadline) {
          return undefined;
        }
        throw error;
      }
    );
    if (page === undefined && sampling) {
      break;
    }
    if (page === undefined) {
      return { files, incomplete: false, truncated: true, nextPageToken: pageToken };
    }
    if (page.incompleteSearch) {
      return { files, incomplete: true, truncated: false };
    }
    files.push(...(page.files ?? []));
    pageToken = page.nextPageToken ?? undefined;
    pagesFetched += 1;
    if (accept && files.some(accept)) break;
    if (maxPages && pagesFetched >= maxPages) break;
  } while (pageToken);
  return { files, incomplete: false, truncated: false };
}

async function listSharedDriveIds({
  drive,
  deadline,
  wording,
}: {
  drive: drive_v3.Drive;
  deadline: number;
  wording: ListingWording;
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
      await listCall({
        deadline,
        wording,
        call: (signal) => drive.drives.list(request, { signal }),
      })
    ).data;
    for (const sharedDrive of page.drives ?? []) {
      if (sharedDrive.id) ids.push(sharedDrive.id);
    }
    pageToken = page.nextPageToken ?? undefined;
  } while (pageToken);
  return ids;
}

function incompleteSearchError({
  params,
  wording,
}: {
  params: drive_v3.Params$Resource$Files$List;
  wording: ListingWording;
}): Error {
  const scope = params.driveId ? `shared drive ${params.driveId}` : 'My Drive';
  if (wording === 'action') {
    return new Error(
      `Google Drive could not search every file in ${scope}. Try again${
        params.driveId ? ', or turn off Include Team Drives' : ''
      }.`
    );
  }
  return new Error(
    `Google Drive could not search every file in ${scope}. The next check will try again.`
  );
}

async function listCompleteCorpus({
  drive,
  params,
  maxPages,
  deadline,
  wording,
  stopAt,
  accept,
}: {
  drive: drive_v3.Drive;
  params: drive_v3.Params$Resource$Files$List;
  maxPages: number | undefined;
  deadline: number;
  wording: ListingWording;
  stopAt: ListingStop | undefined;
  accept: FileAccept | undefined;
}): Promise<PageListing> {
  const result = await listPages({
    drive,
    params,
    maxPages,
    deadline,
    wording,
    stopAt,
    accept,
  });
  if (result.incomplete) {
    throw incompleteSearchError({ params, wording });
  }
  return result;
}

function timestampOf({
  file,
  orderBy,
}: {
  file: drive_v3.Schema$File;
  orderBy: string | undefined;
}): number {
  const value = orderBy?.startsWith('modifiedTime')
    ? file.modifiedTime
    : file.createdTime;
  const epoch = value ? Date.parse(value) : NaN;
  return Number.isNaN(epoch) ? 0 : epoch;
}

function lastReadKey({
  listing,
  orderBy,
}: {
  listing: PageListing;
  orderBy: string | undefined;
}): number {
  const last = listing.files[listing.files.length - 1];
  return last ? timestampOf({ file: last, orderBy }) : 0;
}

async function listSharedDrivesFiles({
  drive,
  params,
  maxPages,
  deadline,
  wording,
  stopAt,
  driveIds,
  accept,
}: {
  drive: drive_v3.Drive;
  params: drive_v3.Params$Resource$Files$List;
  maxPages: number | undefined;
  deadline: number;
  wording: ListingWording;
  stopAt: ListingStop | undefined;
  driveIds: string[];
  accept: FileAccept | undefined;
}): Promise<PageListing[]> {
  const listings: PageListing[] = [];
  for (
    let index = 0;
    index < driveIds.length;
    index += SHARED_DRIVE_LIST_CONCURRENCY
  ) {
    const batch = driveIds.slice(index, index + SHARED_DRIVE_LIST_CONCURRENCY);
    const results = await Promise.all(
      batch.map((driveId) =>
        listCompleteCorpus({
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
          wording,
          stopAt,
          accept,
        })
      )
    );
    listings.push(...results);
  }
  return listings;
}

function mergeListings({
  listings,
  orderBy,
}: {
  listings: PageListing[];
  orderBy: string | undefined;
}): DriveListing {
  const truncatedKeys = listings
    .filter((listing) => listing.truncated)
    .map((listing) => lastReadKey({ listing, orderBy }));
  const watermark = truncatedKeys.reduce(
    (lowest, key) => Math.min(lowest, key),
    Number.POSITIVE_INFINITY
  );
  const byId = new Map<string, drive_v3.Schema$File>();
  for (const file of listings.flatMap((listing) => listing.files)) {
    if (!file.id || byId.has(file.id)) continue;
    if (timestampOf({ file, orderBy }) > watermark) continue;
    byId.set(file.id, file);
  }
  const merged = [...byId.values()];
  if (orderBy) {
    const direction = orderBy.endsWith(' desc') ? -1 : 1;
    merged.sort(
      (a, b) =>
        direction *
        (timestampOf({ file: a, orderBy }) - timestampOf({ file: b, orderBy }))
    );
  }
  return truncatedKeys.length > 0
    ? { files: merged, truncated: true, watermark }
    : { files: merged, truncated: false };
}

function withPosition({
  listing,
  params,
  nextPageToken,
}: {
  listing: DriveListing;
  params: drive_v3.Params$Resource$Files$List;
  nextPageToken: string | undefined;
}): DriveListing {
  if (!listing.truncated || !nextPageToken) {
    return listing;
  }
  return { ...listing, position: { params: resumableParams(params), pageToken: nextPageToken } };
}

function resumedListing({
  listing,
  params,
}: {
  listing: PageListing;
  params: drive_v3.Params$Resource$Files$List;
}): DriveListing {
  const merged = mergeListings({
    listings: [{ ...listing, truncated: true }],
    orderBy: params.orderBy,
  });
  return withPosition({
    listing: merged,
    params,
    nextPageToken: listing.truncated ? listing.nextPageToken : undefined,
  });
}

function resumableParams(
  params: drive_v3.Params$Resource$Files$List
): ResumableParams {
  return {
    q: params.q ?? undefined,
    orderBy: params.orderBy ?? undefined,
    corpora: params.corpora ?? undefined,
    driveId: params.driveId ?? undefined,
    fields: params.fields ?? undefined,
    pageSize: params.pageSize ?? undefined,
    supportsAllDrives: params.supportsAllDrives ?? undefined,
    includeItemsFromAllDrives: params.includeItemsFromAllDrives ?? undefined,
  };
}

async function listPassEntry({
  drive,
  entry,
  maxPages,
  deadline,
  stopAt,
  accept,
}: {
  drive: drive_v3.Drive;
  entry: PassEntry;
  maxPages: number | undefined;
  deadline: number;
  stopAt: ListingStop | undefined;
  accept: FileAccept | undefined;
}): Promise<PassOutcome> {
  if (Date.now() >= deadline) {
    return { entry, listing: undefined };
  }
  const { data, error } = await tryCatch(() =>
    listPages({
      drive,
      params: entry.params,
      maxPages,
      deadline,
      wording: 'poll',
      stopAt,
      startToken: entry.pageToken,
      accept,
    })
  );
  if (error !== null) {
    if (Date.now() >= deadline) {
      return { entry, listing: undefined };
    }
    throw error;
  }
  if (data.incomplete) {
    throw incompleteSearchError({ params: entry.params, wording: 'poll' });
  }
  return { entry, listing: data };
}

function nextPassEntries({
  outcomes,
  watermark,
  orderBy,
}: {
  outcomes: PassOutcome[];
  watermark: number;
  orderBy: string | undefined;
}): PassEntry[] {
  const notListed = outcomes.flatMap((outcome) =>
    outcome.listing === undefined ? [outcome.entry] : []
  );
  const listed = outcomes.flatMap((outcome): PassEntry[] => {
    const listing = outcome.listing;
    if (listing === undefined) {
      return [];
    }
    const heldBack = listing.files.some(
      (file) => timestampOf({ file, orderBy }) > watermark
    );
    if (heldBack) {
      return [outcome.entry];
    }
    if (listing.truncated && listing.nextPageToken) {
      return [
        { params: outcome.entry.params, pageToken: listing.nextPageToken },
      ];
    }
    return [];
  });
  return [...notListed, ...listed];
}

async function runDrivePass({
  drive,
  entries,
  startedAt,
  resumed,
  maxPages,
  deadline,
  stopAt,
  orderBy,
  accept,
}: {
  drive: drive_v3.Drive;
  entries: PassEntry[];
  startedAt: number;
  resumed: boolean;
  maxPages: number | undefined;
  deadline: number;
  stopAt: ListingStop | undefined;
  orderBy: string;
  accept: FileAccept | undefined;
}): Promise<DriveListing> {
  const outcomes = await drivePool.mapInPool({
    items: entries,
    concurrency: SHARED_DRIVE_LIST_CONCURRENCY,
    map: (entry) =>
      listPassEntry({ drive, entry, maxPages, deadline, stopAt, accept }),
  });
  const listings = outcomes.flatMap((outcome) =>
    outcome.listing === undefined ? [] : [outcome.listing]
  );
  const watermark = listings
    .filter((listing) => listing.truncated)
    .map((listing) => lastReadKey({ listing, orderBy }))
    .reduce((lowest, key) => Math.min(lowest, key), Number.POSITIVE_INFINITY);
  const pending = nextPassEntries({ outcomes, watermark, orderBy });
  if (pending.length === 0 && !resumed) {
    return mergeListings({ listings, orderBy });
  }
  const merged = mergeListings({
    listings: listings.map((listing) => ({ ...listing, truncated: false })),
    orderBy,
  });
  const files = merged.files.filter(
    (file) => timestampOf({ file, orderBy }) <= watermark
  );
  if (pending.length === 0) {
    return {
      files,
      truncated: true,
      watermark: startedAt,
      position: { startedAt, pending: [] },
    };
  }
  console.warn(
    `Google Drive: ${pending.length} of ${entries.length} drives are not fully searched yet; the next checks continue where this one stopped.`
  );
  return {
    files,
    truncated: true,
    watermark: startedAt,
    holdCursor: true,
    position: { startedAt, pending },
  };
}

async function listFilesAcrossCorpora({
  drive,
  params,
  maxPages,
  deadline,
  wording = 'poll',
  stopAt,
  resume,
  accept,
}: {
  drive: drive_v3.Drive;
  params: drive_v3.Params$Resource$Files$List;
  maxPages: number | undefined;
  deadline: number | undefined;
  wording?: ListingWording;
  stopAt?: ListingStop;
  resume?: ListingPosition;
  accept?: FileAccept;
}): Promise<DriveListing> {
  const listingDeadline = deadline ?? Date.now() + LISTING_BUDGET_MS;
  if (resume && 'pending' in resume) {
    return runDrivePass({
      drive,
      entries: resume.pending,
      startedAt: resume.startedAt,
      resumed: true,
      maxPages,
      deadline: listingDeadline,
      stopAt,
      orderBy: params.orderBy ?? 'createdTime desc',
      accept,
    });
  }
  if (resume) {
    const resumed = await listPages({
      drive,
      params: resume.params,
      maxPages,
      deadline: listingDeadline,
      wording,
      stopAt,
      startToken: resume.pageToken,
    }).catch(() => undefined);
    if (resumed && !resumed.incomplete) {
      return resumedListing({ listing: resumed, params: resume.params });
    }
  }
  const primary = await listPages({
    drive,
    params,
    maxPages,
    deadline: listingDeadline,
    wording,
    stopAt,
    accept,
  });
  if (!primary.incomplete) {
    return withPosition({
      listing: mergeListings({ listings: [primary], orderBy: params.orderBy }),
      params,
      nextPageToken: primary.nextPageToken,
    });
  }
  if (params.corpora !== 'allDrives') {
    throw incompleteSearchError({ params, wording });
  }
  if (wording === 'poll') {
    const startedAt = Date.now();
    const driveIds = await listSharedDriveIds({
      drive,
      deadline: listingDeadline,
      wording,
    });
    return runDrivePass({
      drive,
      entries: [
        { params: resumableParams({ ...params, corpora: 'user' }) },
        ...driveIds.map((driveId) => ({
          params: resumableParams({
            ...params,
            corpora: 'drive',
            driveId,
            includeItemsFromAllDrives: true,
            supportsAllDrives: true,
          }),
        })),
      ],
      startedAt,
      resumed: false,
      maxPages,
      deadline: listingDeadline,
      stopAt,
      orderBy: params.orderBy ?? 'createdTime desc',
      accept,
    });
  }

  const userListing = await listCompleteCorpus({
    drive,
    params: { ...params, corpora: 'user' },
    maxPages,
    deadline: listingDeadline,
    wording,
    stopAt,
    accept,
  });
  const driveIds = await listSharedDriveIds({
    drive,
    deadline: listingDeadline,
    wording,
  });
  const sharedListings = await listSharedDrivesFiles({
    drive,
    params,
    maxPages,
    deadline: listingDeadline,
    wording,
    stopAt,
    driveIds,
    accept,
  });
  return mergeListings({
    listings: [userListing, ...sharedListings],
    orderBy: params.orderBy ?? 'createdTime desc',
  });
}

function driveQueryTime(value: string | number | Date): string {
  return new Date(value).toISOString();
}

function parentFolderDropdown({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.Dropdown({
    displayName,
    description,
    required: false,
    auth: googleDriveAuth,
    refreshers: ['include_team_drives'],
    refreshOnSearch: true,
    options: async ({ auth, include_team_drives }, ctx) =>
      fetchFolderDropdownOptions({
        auth: auth as GoogleDriveAuthValue | undefined,
        searchValue: ctx?.searchValue,
        includeTeamDrives: include_team_drives as boolean | undefined,
      }),
  });
}

function hasId(file: drive_v3.Schema$File): boolean {
  return Boolean(file.id);
}

export const common = {
  properties: {
    parentFolder: parentFolderDropdown({
      displayName: 'Parent Folder',
      description:
        'Leave empty for the root of My Drive. Type to search by folder name.',
    }),
    include_team_drives: Property.Checkbox({
      displayName: 'Include Team Drives',
      description: 'Also include shared drives, not only My Drive.',
      defaultValue: false,
      required: false,
    }),
  },

  listingBudgetMs: LISTING_BUDGET_MS,
  testSampleMaxPages: TEST_SAMPLE_MAX_PAGES,
  hasId,
  actionListingBudgetMs: ACTION_LISTING_BUDGET_MS,
  watchFolderHint: WATCH_FOLDER_HINT,
  parentFolderDropdown,
  escapeDriveQueryLiteral,
  fetchFolderDropdownOptions,
  listFilesAcrossCorpora,

  async getFiles(
    auth: GoogleDriveAuthValue,
    search?: {
      parent?: string;
      createdTime?: string | number | Date;
      createdTimeOp?: string;
      changedSince?: string | number | Date;
      changedSinceOp?: string;
      modifiedTime?: string | number | Date;
      modifiedTimeOp?: string;
      mimeTypes?: string[];
      excludeShortcuts?: boolean;
      maxPages?: number;
      includeTeamDrive?: boolean;
      deadline?: number;
      stopAt?: ListingStop;
      resume?: ListingPosition;
      accept?: FileAccept;
    },
    order?: string
  ): Promise<DriveListing> {
    const authClient = await createGoogleClient(auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    const q: string[] = [];
    if (search?.parent)
      q.push(`'${escapeDriveQueryLiteral(search.parent)}' in parents`);
    if (search?.createdTime)
      q.push(
        `createdTime ${search.createdTimeOp ?? '>'} '${driveQueryTime(
          search.createdTime
        )}'`
      );
    if (search?.modifiedTime)
      q.push(
        `modifiedTime ${search.modifiedTimeOp ?? '>'} '${driveQueryTime(
          search.modifiedTime
        )}'`
      );
    if (search?.changedSince) {
      const changedSince = driveQueryTime(search.changedSince);
      const op = search.changedSinceOp ?? '>';
      q.push(
        `(modifiedTime ${op} '${changedSince}' or createdTime ${op} '${changedSince}')`
      );
    }
    if (search?.mimeTypes?.length)
      q.push(
        `(${search.mimeTypes
          .map(
            (mimeType) => `mimeType='${escapeDriveQueryLiteral(mimeType)}'`
          )
          .join(' or ')})`
      );
    if (search?.excludeShortcuts)
      q.push(`mimeType!='application/vnd.google-apps.shortcut'`);
    q.push(`trashed = false`);
    return listFilesAcrossCorpora({
      drive,
      params: {
        q: q.concat("mimeType!='application/vnd.google-apps.folder'").join(' and '),
        fields:
          'nextPageToken, incompleteSearch, files(id, name, mimeType, webViewLink, kind, createdTime, modifiedTime)',
        orderBy: order ?? 'createdTime desc',
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: search?.includeTeamDrive,
        corpora: search?.includeTeamDrive ? 'allDrives' : 'user',
      },
      maxPages: search?.maxPages,
      deadline: search?.deadline,
      stopAt: search?.stopAt,
      resume: search?.resume,
      accept: search?.accept,
    });
  },

  async getFolders(
    auth: GoogleDriveAuthValue,
    search?: {
      parent?: string;
      createdTime?: string | number | Date;
      createdTimeOp?: string;
      includeTeamDrive?: boolean;
      maxPages?: number;
      deadline?: number;
      stopAt?: ListingStop;
      resume?: ListingPosition;
      accept?: FileAccept;
    },
    order?: string
  ): Promise<DriveListing> {
    const authClient = await createGoogleClient(auth);

    const drive = googleDrive({ version: 'v3', auth: authClient });

    const q: string[] = [`mimeType='application/vnd.google-apps.folder'`];
    if (search?.parent)
      q.push(`'${escapeDriveQueryLiteral(search.parent)}' in parents`);
    if (search?.createdTime)
      q.push(
        `createdTime ${search.createdTimeOp ?? '>'} '${driveQueryTime(
          search.createdTime
        )}'`
      );
    q.push(`trashed = false`);
    return listFilesAcrossCorpora({
      drive,
      params: {
        q: q.join(' and '),
        fields: 'nextPageToken, incompleteSearch, files(id, name, createdTime)',
        orderBy: order ?? 'createdTime desc',
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: search?.includeTeamDrive,
        corpora: search?.includeTeamDrive ? 'allDrives' : 'user',
      },
      maxPages: search?.maxPages,
      deadline: search?.deadline,
      stopAt: search?.stopAt,
      resume: search?.resume,
      accept: search?.accept,
    });
  },
};

type ListingWording = 'poll' | 'action';

type PageListing = {
  files: drive_v3.Schema$File[];
  incomplete: boolean;
  truncated: boolean;
  nextPageToken?: string;
};

export type ListingStop = { maxFiles: number };

export type FileAccept = (file: drive_v3.Schema$File) => boolean;

export type ResumableParams = {
  q?: string;
  orderBy?: string;
  corpora?: string;
  driveId?: string;
  fields?: string;
  pageSize?: number;
  supportsAllDrives?: boolean;
  includeItemsFromAllDrives?: boolean;
};

export type PassEntry = { params: ResumableParams; pageToken?: string };

export type ListingPosition =
  | { params: ResumableParams; pageToken: string }
  | { startedAt: number; pending: PassEntry[] };

type PassOutcome = { entry: PassEntry; listing: PageListing | undefined };

export type DriveListing =
  | { files: drive_v3.Schema$File[]; truncated: false }
  | {
      files: drive_v3.Schema$File[];
      truncated: true;
      watermark: number;
      holdCursor?: boolean;
      position?: ListingPosition;
    };
