import { createTrigger, isNil, Property, Store, TriggerStrategy } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { ShortIoAuthValue } from '../common/client';
import { shortIoLinkQueries } from '../common/link-queries';
import { shortIoLinks, ShortIoDomainRef } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { domainIdDropdown } from '../common/props';

const LEGACY_IDS_KEY = 'shortio-last-link-ids';
const STATE_KEY = 'shortio-new-links-v3';
const PAGE_SIZE = 150;
const MAX_PAGES = 10;
const DEEP_SCAN_PAGES = 20;
const SEEN_LIMIT = 5000;
const UPDATED_AT_MARGIN_MS = 5 * 60 * 1000;
const TEST_SAMPLE_SIZE = 5;

function timeMs({ link, key }: { link: Record<string, unknown>; key: string }): number {
  const value = link[key];
  if (typeof value === 'number') {
    return value;
  }
  return typeof value === 'string' ? Date.parse(value) : NaN;
}

function linkId(link: Record<string, unknown>): string {
  return String(link['idString'] ?? link['id'] ?? '');
}

function idOrderKey(id: string): string {
  const parts = id.split('_');
  return parts.length >= 3 ? parts.slice(2).join('_') : id;
}

function maxOrderKey(ids: string[]): string | null {
  return ids.map(idOrderKey).reduce<string | null>((max, key) => (max === null || key > max ? key : max), null);
}

function createdAfterBaseline({ link, state }: { link: Record<string, unknown>; state: PollState }): boolean {
  const idIsNewer = state.baselineMaxKey === null || idOrderKey(linkId(link)) > state.baselineMaxKey;
  return idIsNewer || timeMs({ link, key: 'createdAt' }) >= state.baselineAt;
}

function backdatedSinceLastPoll({ link, state }: { link: Record<string, unknown>; state: PollState }): boolean {
  const idIsNewer = state.baselineMaxKey !== null && idOrderKey(linkId(link)) > state.baselineMaxKey;
  const updatedAt = timeMs({ link, key: 'updatedAt' });
  return idIsNewer && updatedAt >= state.baselineAt && updatedAt >= state.lastPollAt - UPDATED_AT_MARGIN_MS;
}

function toEvent({ link, domain }: { link: Record<string, unknown>; domain: ShortIoDomainRef }): Record<string, unknown> {
  return {
    id: linkId(link),
    originalURL: link['originalURL'],
    shortURL: link['shortURL'],
    secureShortURL: link['secureShortURL'],
    title: link['title'],
    path: link['path'],
    createdAt: link['createdAt'],
    updatedAt: link['updatedAt'],
    tags: link['tags'],
    redirectType: link['redirectType'],
    domainId: link['DomainId'] ?? link['domainId'],
    folderId: link['FolderId'],
    ownerId: link['OwnerId'],
    hasPassword: link['hasPassword'],
    cloaking: link['cloaking'],
    expiresAt: link['expiresAt'],
    expiredURL: link['expiredURL'],
    clicksLimit: link['clicksLimit'],
    archived: link['archived'],
    utmSource: link['utmSource'],
    utmMedium: link['utmMedium'],
    utmCampaign: link['utmCampaign'],
    utmTerm: link['utmTerm'],
    utmContent: link['utmContent'],
    androidURL: link['androidURL'],
    iphoneURL: link['iphoneURL'],
    triggerInfo: {
      source: 'short.io',
      type: 'new_link_created',
      detectedAt: new Date().toISOString(),
      domain: domain.hostname,
    },
    raw: link,
  };
}

async function newestLinks({ auth, domain, limit }: { auth: ShortIoAuthValue; domain: ShortIoDomainRef; limit: number }): Promise<Record<string, unknown>[]> {
  const page = await shortIoLinkQueries.listPage({ auth, domainId: domain.id, query: { limit, dateSortOrder: 'desc' } });
  return page.links;
}

async function scan({ auth, domain, seen, startToken, maxPages, stopWhenSeen, accept, order = 'desc' }: {
  auth: ShortIoAuthValue;
  order?: 'asc' | 'desc';
  domain: ShortIoDomainRef;
  seen: Set<string>;
  startToken: string | undefined;
  maxPages: number;
  stopWhenSeen: boolean;
  accept: (link: Record<string, unknown>) => boolean;
}): Promise<ScanResult> {
  const found: Record<string, unknown>[] = [];
  const pageIds: string[] = [];
  let pageToken = startToken;
  let count: number | null = null;
  for (let page = 0; page < maxPages; page++) {
    const result = await shortIoLinkQueries.listPage({
      auth,
      domainId: domain.id,
      query: { limit: PAGE_SIZE, dateSortOrder: order, pageToken },
    });
    count = count ?? result.count;
    pageIds.push(...result.links.map(linkId));
    const fresh = result.links.filter((link) => !seen.has(linkId(link)) && accept(link));
    found.push(...fresh);
    pageToken = result.nextPageToken ?? undefined;
    if (!pageToken || (stopWhenSeen && fresh.length === 0)) {
      return { found, pageIds, nextToken: pageToken ?? null, exhausted: pageToken === undefined, stoppedOnSeenPage: fresh.length === 0, count };
    }
  }
  return { found, pageIds, nextToken: pageToken ?? null, exhausted: false, stoppedOnSeenPage: false, count };
}

async function baseline({ auth, domain, store }: { auth: ShortIoAuthValue; domain: ShortIoDomainRef; store: Store }): Promise<PollState> {
  const result = await scan({ auth, domain, seen: new Set(), startToken: undefined, maxPages: MAX_PAGES, stopWhenSeen: false, accept: () => true });
  const oldest = result.exhausted
    ? null
    : await scan({ auth, domain, seen: new Set(result.pageIds), startToken: undefined, maxPages: MAX_PAGES, stopWhenSeen: false, accept: () => true, order: 'asc' });
  const now = Date.now();
  const ids = [...result.found, ...(oldest?.found ?? [])].map(linkId);
  const state: PollState = { seen: ids.slice(0, SEEN_LIMIT), lastCount: result.count, lastPollAt: now, resumeToken: null, baselineAt: now, baselineMaxKey: maxOrderKey(ids) };
  await store.put<PollState>(STATE_KEY, state);
  return state;
}

async function pollNewLinks({ auth, domain, store }: { auth: ShortIoAuthValue; domain: ShortIoDomainRef; store: Store }): Promise<Record<string, unknown>[]> {
  const state = await store.get<PollState>(STATE_KEY);
  if (!state || typeof state.baselineAt !== 'number') {
    return migrateFromLegacy({ auth, domain, store });
  }
  const now = Date.now();
  const seen = new Set(state.seen);
  const top = await scan({ auth, domain, seen, startToken: undefined, maxPages: MAX_PAGES, stopWhenSeen: true, accept: (link) => createdAfterBaseline({ link, state }) });
  top.found.forEach((link) => seen.add(linkId(link)));
  const resumed = state.resumeToken
    ? await scan({ auth, domain, seen, startToken: state.resumeToken, maxPages: MAX_PAGES, stopWhenSeen: false, accept: (link) => createdAfterBaseline({ link, state }) })
    : null;
  resumed?.found.forEach((link) => seen.add(linkId(link)));
  const resumeToken = !top.stoppedOnSeenPage && !top.exhausted ? top.nextToken : resumed && !resumed.exhausted ? resumed.nextToken : null;
  const foundSoFar = top.found.length + (resumed?.found.length ?? 0);
  const growth = top.count !== null && state.lastCount !== null ? top.count - state.lastCount : 0;
  const deep =
    growth > foundSoFar && resumeToken === null && top.nextToken
      ? await scan({
          auth,
          domain,
          seen,
          startToken: top.nextToken,
          maxPages: DEEP_SCAN_PAGES,
          stopWhenSeen: false,
          accept: (link) => backdatedSinceLastPoll({ link, state }),
        })
      : null;
  const emitted = [...top.found, ...(resumed?.found ?? []), ...(deep?.found ?? [])];
  const unique = [...new Map(emitted.map((link) => [linkId(link), link])).values()].sort(
    (a, b) => timeMs({ link: a, key: 'updatedAt' }) - timeMs({ link: b, key: 'updatedAt' }),
  );
  const nextSeen = [...new Set([...top.pageIds, ...unique.map(linkId).reverse(), ...state.seen])].slice(0, SEEN_LIMIT);
  await store.put<PollState>(STATE_KEY, { ...state, seen: nextSeen, lastCount: top.count ?? state.lastCount, lastPollAt: now, resumeToken });
  return unique;
}

async function migrateFromLegacy({ auth, domain, store }: { auth: ShortIoAuthValue; domain: ShortIoDomainRef; store: Store }): Promise<Record<string, unknown>[]> {
  const legacyIds = await store.get<string[]>(LEGACY_IDS_KEY);
  const links = await newestLinks({ auth, domain, limit: PAGE_SIZE });
  await baseline({ auth, domain, store });
  if (!legacyIds) {
    return [];
  }
  await store.delete(LEGACY_IDS_KEY);
  const known = new Set(legacyIds);
  return links.filter((link) => !known.has(linkId(link))).reverse();
}

export const newLinkCreatedTrigger = createTrigger({
  auth: shortIoAuth,
  name: 'new_link_created',
  classification: 'READ',
  displayName: 'New Link Created',
  description: 'Fires when a new short link is created on a domain. Useful to sync newly created links to other systems.',
  aiMetadata: {
    description:
      "Fires once for each new short link created on the selected Short.io domain, detected by polling the domain's link list. Each event is one link (short URL, original URL, path, title, tags); the link password is never included.",
  },
  type: TriggerStrategy.POLLING,
  outputSchema: shortIoSchemas.trigger,
  props: {
    domain: {
      ...domainIdDropdown,
      required: true,
      description: 'Select the domain to monitor for new links',
    },
    pollingInterval: Property.StaticDropdown({
      displayName: 'Polling Interval',
      description: 'Not used: Activepieces sets the polling schedule. Kept so existing flows keep working.',
      required: false,
      defaultValue: '5',
      options: {
        disabled: false,
        options: [
          { label: 'Every 1 minute', value: '1' },
          { label: 'Every 5 minutes', value: '5' },
          { label: 'Every 15 minutes', value: '15' },
          { label: 'Every 30 minutes', value: '30' },
          { label: 'Every hour', value: '60' },
        ],
      },
    }),
  },
  async onEnable(context) {
    const domain = shortIoLinks.parseDomainProp(context.propsValue.domain);
    if (context.isRepublish && (!isNil(await context.store.get(STATE_KEY)) || !isNil(await context.store.get(LEGACY_IDS_KEY)))) {
      return;
    }
    await context.store.delete(LEGACY_IDS_KEY);
    await baseline({ auth: context.auth, domain, store: context.store });
  },
  async onDisable(context) {
    if (context.isRepublish) {
      return;
    }
    await context.store.delete(STATE_KEY);
    await context.store.delete(LEGACY_IDS_KEY);
  },
  async run(context) {
    const domain = shortIoLinks.parseDomainProp(context.propsValue.domain);
    const links = await pollNewLinks({ auth: context.auth, domain, store: context.store });
    return links.map((link) => toEvent({ link, domain }));
  },
  async test(context) {
    const domain = shortIoLinks.parseDomainProp(context.propsValue.domain);
    const links = await newestLinks({ auth: context.auth, domain, limit: TEST_SAMPLE_SIZE });
    return links.map((link) => toEvent({ link, domain }));
  },
  sampleData: {
    id: 'lnk_61Mb_0dnRUg3vvtmAPZh3dhQh6',
    originalURL: 'https://example.com/page',
    shortURL: 'https://yourdomain.short.io/abc123',
    secureShortURL: 'https://yourdomain.short.io/abc123',
    title: 'Example Page Title',
    path: 'abc123',
    createdAt: '2025-01-15T12:00:00.000Z',
    updatedAt: '2025-01-15T12:00:00.000Z',
    tags: ['marketing', 'campaign'],
    redirectType: 302,
    domainId: 123456,
    folderId: null,
    ownerId: 789,
    hasPassword: false,
    cloaking: false,
    expiresAt: null,
    expiredURL: null,
    clicksLimit: null,
    archived: false,
    utmSource: 'newsletter',
    utmMedium: 'email',
    utmCampaign: 'january_promo',
    utmTerm: null,
    utmContent: null,
    androidURL: null,
    iphoneURL: null,
    triggerInfo: {
      source: 'short.io',
      type: 'new_link_created',
      detectedAt: '2025-01-15T12:01:00.000Z',
      domain: 'yourdomain.short.io',
    },
    raw: {},
  },
});

type PollState = {
  seen: string[];
  lastCount: number | null;
  lastPollAt: number;
  resumeToken: string | null;
  baselineAt: number;
  baselineMaxKey: string | null;
};

type ScanResult = { found: Record<string, unknown>[]; pageIds: string[]; nextToken: string | null; exhausted: boolean; stoppedOnSeenPage: boolean; count: number | null };
