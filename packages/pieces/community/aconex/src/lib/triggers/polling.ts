import type { Store } from '@activepieces/pieces-framework';
import {
  fetchDocumentIntegrity,
  fetchMailIntegrity,
  getDocumentMetadata,
  getMail,
  listDocuments,
  listProjectMail,
} from '../api';
import { AconexAuthProps, assertAuthProps, readAuth } from '../auth-props';
import { aconexNow } from '../client';
import { AconexError } from '../errors';
import { logEvent } from '../log';
import { isXmlRecord, xmlChildren, xmlText, type XmlRecord } from '../xml';

export const ACONEX_CURSOR_KEY = 'aconexCursor';
const SEEN_CAP = 5000;
const PAGE_CAP = 25;

export type AconexCursor = {
  sinceHour: string;
  baselineEpoch: number;
  seen: string[];
};

type PollKind = 'mail' | 'document';

type IntegrityRow = {
  key: string;
  id: string;
  realEpoch: number;
  eventHour: string;
  lastModifiedDate: string;
  lastEventDate?: string;
};

export async function ensureCursor(store: Store): Promise<void> {
  const existing = await store.get<AconexCursor>(ACONEX_CURSOR_KEY);
  if (existing) {
    return;
  }
  const now = aconexNow();
  await store.put<AconexCursor>(ACONEX_CURSOR_KEY, {
    sinceHour: floorUtcHour(now),
    baselineEpoch: now,
    seen: [],
  });
}

export async function loadPollingItems(params: {
  kind: PollKind;
  auth: unknown;
  store: Store;
  propsValue: { projectId?: string; mailBox?: string };
  lastFetchEpochMS: number;
}): Promise<{ epochMilliSeconds: number; data: unknown }[]> {
  const auth = assertAuthProps(readAuth(params.auth));
  const projectId = String(params.propsValue.projectId ?? '');
  if (params.lastFetchEpochMS === 0) {
    return params.kind === 'mail'
      ? sampleMail(auth, projectId, String(params.propsValue.mailBox ?? ''))
      : sampleDocuments(auth, projectId);
  }

  const cursor = await readCursor(params.store);
  const sinceHour = floorUtcHour(Date.parse(cursor.sinceHour));
  const document = params.kind === 'mail'
    ? await fetchMailIntegrity(auth, projectId, sinceHour, String(params.propsValue.mailBox ?? ''))
    : await fetchDocumentIntegrity(auth, projectId, sinceHour);
  const allRows = params.kind === 'mail' ? mailRows(document) : documentRows(document);
  const seen = new Set(cursor.seen);
  const unseen = allRows.filter((row) => !seen.has(row.key));
  const baseline = unseen.filter((row) => row.realEpoch <= cursor.baselineEpoch);
  const active = unseen
    .filter((row) => row.realEpoch > cursor.baselineEpoch)
    .sort((a, b) => a.realEpoch - b.realEpoch || compareId(a.id, b.id));
  const page = active.slice(0, PAGE_CAP);
  const additions = [...baseline.map((row) => row.key), ...page.map((row) => row.key)];
  assertSeenCapacity(seen, additions);

  const split = page.length > 0 && active[PAGE_CAP] !== undefined && active[PAGE_CAP].realEpoch === page[page.length - 1].realEpoch;
  const returned: { epochMilliSeconds: number; data: unknown }[] = [];
  for (const row of page) {
    const data = await hydrate(params.kind, auth, projectId, row);
    let epoch = split ? params.lastFetchEpochMS + 1 : row.realEpoch;
    if (epoch <= params.lastFetchEpochMS) {
      epoch = params.lastFetchEpochMS + 1;
    }
    returned.push({ epochMilliSeconds: epoch, data });
  }

  for (const key of additions) {
    seen.add(key);
  }
  const next: AconexCursor = {
    sinceHour: advanceSinceHour(sinceHour, allRows, seen),
    baselineEpoch: cursor.baselineEpoch,
    seen: [...seen],
  };
  await params.store.put(ACONEX_CURSOR_KEY, next);
  logEvent('aconex.poll', {
    trigger: params.kind,
    projectId,
    integrityRows: allRows.length,
    hydrated: page.length,
    seen: seen.size,
  });
  return returned;
}

export function floorUtcHour(epochMs: number): string {
  const date = new Date(epochMs);
  if (Number.isNaN(date.getTime())) {
    throw new AconexError('CURSOR_INVALID', 'The poll cursor hour is invalid and was not changed.');
  }
  date.setUTCMinutes(0, 0, 0);
  return date.toISOString();
}

async function sampleMail(
  auth: AconexAuthProps,
  projectId: string,
  mailBox: string,
): Promise<{ epochMilliSeconds: number; data: unknown }[]> {
  const document = await listProjectMail(auth, { projectId, mailBox, pageSize: 25, pageNumber: 1 });
  return searchRows(document, 'MailSearch', 'Mail')
    .slice(0, 5)
    .map((row) => ({ epochMilliSeconds: epochFrom(row, ['SentDate', 'sentdate']) ?? 1, data: row }));
}

async function sampleDocuments(
  auth: AconexAuthProps,
  projectId: string,
): Promise<{ epochMilliSeconds: number; data: unknown }[]> {
  const document = await listDocuments(auth, { projectId, pageSize: 25, pageNumber: 1 });
  return searchRows(document, 'RegisterSearch', 'Document')
    .slice(0, 5)
    .map((row) => ({ epochMilliSeconds: epochFrom(row, ['DateModified']) ?? 1, data: row }));
}

async function hydrate(kind: PollKind, auth: AconexAuthProps, projectId: string, row: IntegrityRow): Promise<unknown> {
  try {
    if (kind === 'mail') {
      return await getMail(auth, projectId, row.id);
    }
    return await getDocumentMetadata(auth, projectId, row.id);
  } catch (error) {
    const errorCode = error instanceof AconexError ? error.code : 'HYDRATION_FAILED';
    if (kind === 'mail') {
      return { id: row.id, lastModifiedDate: row.lastModifiedDate, hydration: 'failed', errorCode };
    }
    return {
      DocumentId: row.id,
      lastModifiedDate: row.lastModifiedDate,
      lastEventDate: row.lastEventDate,
      hydration: 'failed',
      errorCode,
    };
  }
}

function mailRows(document: unknown): IntegrityRow[] {
  return integrityRows(document, 'Mail').flatMap((row) => {
    const id = xmlText(row['id']);
    const lastModifiedDate = xmlText(row['lastModifiedDate']);
    if (!id || !lastModifiedDate) {
      return [];
    }
    const realEpoch = epochFrom(row, ['lastModifiedDate']) ?? 0;
    return [{
      key: `${id}:${lastModifiedDate}`,
      id,
      realEpoch,
      eventHour: floorUtcHour(realEpoch),
      lastModifiedDate,
    }];
  });
}

function documentRows(document: unknown): IntegrityRow[] {
  return integrityRows(document, 'Document').flatMap((row) => {
    const id = xmlText(row['DocumentId']);
    const lastModifiedDate = xmlText(row['lastModifiedDate']);
    const lastEventDate = xmlText(row['lastEventDate']);
    if (!id || !lastModifiedDate) {
      return [];
    }
    const modified = epochFrom(row, ['lastModifiedDate']);
    const event = epochFrom(row, ['lastEventDate']);
    const realEpoch = Math.max(modified ?? 0, event ?? 0);
    return [{
      key: `${id}:${lastModifiedDate}:${lastEventDate}`,
      id,
      realEpoch,
      eventHour: floorUtcHour(realEpoch),
      lastModifiedDate,
      lastEventDate,
    }];
  });
}

function integrityRows(document: unknown, child: string): XmlRecord[] {
  const root = isXmlRecord(document) ? document : {};
  const results = isXmlRecord(root['IntegrityCheckResults']) ? root['IntegrityCheckResults'] : {};
  return xmlChildren(results[child]);
}

function searchRows(document: unknown, rootName: string, rowName: string): XmlRecord[] {
  const root = isXmlRecord(document) ? document : {};
  const body = isXmlRecord(root[rootName]) ? root[rootName] : {};
  const search = isXmlRecord(body['SearchResults']) ? body['SearchResults'] : {};
  return xmlChildren(search[rowName]);
}

async function readCursor(store: Store): Promise<AconexCursor> {
  const value = await store.get<AconexCursor>(ACONEX_CURSOR_KEY);
  if (!value || typeof value.sinceHour !== 'string' || typeof value.baselineEpoch !== 'number' || !Array.isArray(value.seen)) {
    throw new AconexError('CURSOR_MISSING', 'The poll cursor is missing. Enable the trigger again.');
  }
  if (value.seen.some((key) => typeof key !== 'string')) {
    throw new AconexError('CURSOR_INVALID', 'The poll cursor is invalid and was not changed.');
  }
  return value;
}

function assertSeenCapacity(seen: Set<string>, additions: string[]): void {
  const next = new Set(seen);
  for (const key of additions) {
    if (!next.has(key) && next.size >= SEEN_CAP) {
      throw new AconexError('SEEN_SET_FULL', 'The poll has 5000 stored keys and cannot take more. The hour was not moved.');
    }
    next.add(key);
  }
}

function advanceSinceHour(sinceHour: string, rows: IntegrityRow[], seen: Set<string>): string {
  const current = floorUtcHour(aconexNow());
  if (sinceHour >= current) {
    return current;
  }
  const blocked = new Set<string>();
  for (const row of rows) {
    if (!seen.has(row.key)) {
      blocked.add(row.eventHour);
    }
  }
  let hour = sinceHour;
  while (hour < current && !blocked.has(hour)) {
    hour = floorUtcHour(Date.parse(hour) + 60 * 60 * 1000);
  }
  return hour > current ? current : hour;
}

function epochFrom(row: XmlRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const parsed = Date.parse(xmlText(row[key]));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}

function compareId(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
