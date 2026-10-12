import { createTrigger, Property, Store, TriggerStrategy } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { ShortIoAuthValue } from '../common/client';
import { shortIoLinkQueries } from '../common/link-queries';
import { shortIoLinks, ShortIoDomainRef } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { domainIdDropdown } from '../common/props';

const LEGACY_IDS_KEY = 'shortio-last-link-ids';
const WATERMARK_KEY = 'shortio-link-watermark-v2';
const PAGE_SIZE = 150;
const MAX_PAGES = 10;
const TEST_SAMPLE_SIZE = 5;

function createdAtMs(link: Record<string, unknown>): number {
  const value = link['createdAt'];
  if (typeof value === 'number') {
    return value;
  }
  return typeof value === 'string' ? Date.parse(value) : NaN;
}

function linkId(link: Record<string, unknown>): string {
  return String(link['idString'] ?? link['id'] ?? '');
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

function watermarkOf({ links, fallback }: { links: Record<string, unknown>[]; fallback: number }): Watermark {
  const times = links.map(createdAtMs).filter((time) => Number.isFinite(time));
  if (times.length === 0) {
    return { createdAt: fallback, ids: [] };
  }
  const newest = times.reduce((max, time) => (time > max ? time : max), times[0]);
  return { createdAt: newest, ids: links.filter((link) => createdAtMs(link) === newest).map(linkId) };
}

async function baseline({ auth, domain, store }: { auth: ShortIoAuthValue; domain: ShortIoDomainRef; store: Store }): Promise<void> {
  const links = await newestLinks({ auth, domain, limit: 1 });
  await store.put<Watermark>(WATERMARK_KEY, watermarkOf({ links, fallback: Date.now() }));
}

async function pollNewLinks({ auth, domain, store }: { auth: ShortIoAuthValue; domain: ShortIoDomainRef; store: Store }): Promise<Record<string, unknown>[]> {
  const watermark = await store.get<Watermark>(WATERMARK_KEY);
  if (!watermark) {
    return migrateFromLegacy({ auth, domain, store });
  }
  const seen = new Set(watermark.ids);
  const collected: Record<string, unknown>[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await shortIoLinkQueries.listPage({
      auth,
      domainId: domain.id,
      query: {
        limit: PAGE_SIZE,
        dateSortOrder: 'asc',
        afterDate: new Date(watermark.createdAt - 1).toISOString(),
        pageToken,
      },
    });
    collected.push(...result.links);
    pageToken = result.nextPageToken ?? undefined;
    if (!pageToken) {
      break;
    }
  }
  const truncated = pageToken !== undefined;
  const fresh = collected
    .filter((link) => {
      const time = createdAtMs(link);
      return Number.isFinite(time) && (time > watermark.createdAt || (time === watermark.createdAt && !seen.has(linkId(link))));
    })
    .sort((a, b) => createdAtMs(a) - createdAtMs(b));
  if (fresh.length === 0) {
    return [];
  }
  const next = watermarkOf({ links: fresh, fallback: watermark.createdAt });
  const ids = next.createdAt === watermark.createdAt ? [...watermark.ids, ...next.ids] : next.ids;
  await store.put<Watermark>(WATERMARK_KEY, { createdAt: next.createdAt, ids, ...(truncated ? { truncatedAt: Date.now() } : {}) });
  return fresh;
}

async function migrateFromLegacy({ auth, domain, store }: { auth: ShortIoAuthValue; domain: ShortIoDomainRef; store: Store }): Promise<Record<string, unknown>[]> {
  const legacyIds = await store.get<string[]>(LEGACY_IDS_KEY);
  const links = await newestLinks({ auth, domain, limit: PAGE_SIZE });
  await store.put<Watermark>(WATERMARK_KEY, watermarkOf({ links, fallback: Date.now() }));
  if (!legacyIds) {
    return [];
  }
  await store.delete(LEGACY_IDS_KEY);
  const known = new Set(legacyIds);
  return links.filter((link) => !known.has(linkId(link))).sort((a, b) => createdAtMs(a) - createdAtMs(b));
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
    await context.store.delete(LEGACY_IDS_KEY);
    await baseline({ auth: context.auth, domain, store: context.store });
  },
  async onDisable(context) {
    await context.store.delete(WATERMARK_KEY);
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

type Watermark = { createdAt: number; ids: string[]; truncatedAt?: number };
