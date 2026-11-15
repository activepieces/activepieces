import { afterEach, describe, expect, test, vi } from 'vitest';
import { createShortLinkAction } from '../src/lib/actions/create-short-link';
import { updateShortLinkAction } from '../src/lib/actions/update-short-link';
import { domainStatisticsAction } from '../src/lib/actions/domain-statistics';
import { createLinkAiAction } from '../src/lib/actions/ai/create-link';
import { findLinkByPathAiAction } from '../src/lib/actions/ai/find-link-by-path';
import { shortIoValues } from '../src/lib/common/values';
import { DOMAIN_PROP, DOMAINS, link, replies, run, stubFetch } from './helpers';

const NOW = Date.parse('2026-10-12T00:00:00.000Z');

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('TTL (P1-1)', () => {
  test('converts seconds to an absolute deletion time', () => {
    expect(shortIoValues.ttlSecondsToDeleteAt({ seconds: 8 * 86400, now: NOW })).toBe('2026-10-20T00:00:00.000Z');
  });
  test('rejects less than 7 days instead of sending a 1970 timestamp', () => {
    expect(() => shortIoValues.ttlSecondsToDeleteAt({ seconds: 86400, now: NOW })).toThrow('at least 604800 seconds');
  });
  test('create-short-link sends ttl as ISO time from now, never ttl*1000', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const seen = stubFetch(replies([{ body: link() }]));
    await run({ action: createShortLinkAction, props: { domain: DOMAIN_PROP, originalURL: 'https://example.com/a', ttl: 8 * 86400, clicksLimit: 0 } }).catch(() => undefined);
    expect(seen).toHaveLength(0);
    await run({ action: createShortLinkAction, props: { domain: DOMAIN_PROP, originalURL: 'https://example.com/a', ttl: 8 * 86400 } });
    expect(seen[0].body).toMatchObject({ domain: 'go.example.com', originalURL: 'https://example.com/a', ttl: '2026-10-20T00:00:00.000Z' });
  });
  test('AI create_link deleteAt must be 7+ days ahead', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    stubFetch(replies([{ body: DOMAINS }, { body: link() }]));
    await expect(run({ action: createLinkAiAction, props: { domain: 'go.example.com', originalURL: 'https://example.com', deleteAt: '2026-10-13T00:00:00Z' } })).rejects.toThrow('at least 7 days');
  });
});

describe('password scrub (P1-2) and path encoding (P1-3)', () => {
  test('create returns the link without password', async () => {
    stubFetch(replies([{ body: link() }]));
    const result = await run({ action: createShortLinkAction, props: { domain: DOMAIN_PROP, originalURL: 'https://example.com/a', password: 'hunter2' } });
    expect(JSON.stringify(result)).not.toContain('hunter2');
    expect(result).toMatchObject({ success: true, data: { idString: 'lnk_abc_123', linkId: 'lnk_abc_123', hasPassword: true } });
  });
  test('update encodes link ID and passes domain_id', async () => {
    const seen = stubFetch(replies([{ body: link() }]));
    await run({ action: updateShortLinkAction, props: { domain: DOMAIN_PROP, linkId: '../domains/settings/1', title: 'x' } });
    expect(seen[0].url.pathname).toBe('/links/..%2Fdomains%2Fsettings%2F1');
    expect(seen[0].url.searchParams.get('domain_id')).toBe('101');
    expect(seen[0].body).toEqual({ title: 'x' });
  });
  test('clicksLimit 0 is rejected, not silently dropped', async () => {
    stubFetch(replies([{ body: link() }]));
    await expect(run({ action: updateShortLinkAction, props: { domain: DOMAIN_PROP, linkId: 'lnk_a_b', clicksLimit: 0 } })).rejects.toThrow('Clicks limit');
  });
});

describe('statistics', () => {
  test('legacy thisMonth maps to month and dates keep the picked day', async () => {
    const seen = stubFetch(replies([{ body: { clicks: 3, links: 1 } }]));
    await run({ action: domainStatisticsAction, props: { domainId: DOMAIN_PROP, period: 'thisMonth' } });
    expect(seen[0].url.searchParams.get('period')).toBe('month');
    await run({ action: domainStatisticsAction, props: { domainId: DOMAIN_PROP, period: 'custom', startDate: '2026-10-01T23:30:00-05:00', endDate: '2026-10-05', tz: 'America/Chicago' } });
    expect(seen[1].url.searchParams.get('startDate')).toBe('2026-10-01');
    expect(seen[1].url.searchParams.get('tz')).toBe('America/Chicago');
  });
  test('unknown timezone fails before any request', async () => {
    const seen = stubFetch(replies([{ body: {} }]));
    await expect(run({ action: domainStatisticsAction, props: { domainId: DOMAIN_PROP, period: 'last7', tz: 'Mars/Base' } })).rejects.toThrow('Unknown timezone');
    expect(seen).toHaveLength(0);
  });
});

describe('domain resolver and short URL lookup', () => {
  test('resolves hostname from a full short URL and returns found=false on 404', async () => {
    const seen = stubFetch((request) => (request.url.pathname === '/api/domains' ? { body: DOMAINS } : { status: 404, body: { error: 'Link not found' } }));
    const result = await run({ action: findLinkByPathAiAction, props: { shortUrl: 'https://links.acme.io/promo' } });
    expect(result).toEqual({ found: false, link: null });
    expect(seen[1].url.searchParams.get('domain')).toBe('links.acme.io');
    expect(seen[1].url.searchParams.get('path')).toBe('promo');
  });
  test('unknown domain lists known ones', async () => {
    stubFetch(replies([{ body: DOMAINS }]));
    await expect(run({ action: findLinkByPathAiAction, props: { shortUrl: 'promo', domain: 'nope.com' } })).rejects.toThrow('Known domains: go.example.com, links.acme.io');
  });
});

describe('owner photo URL', () => {
  test('presigned User.photoURL is removed from link output', async () => {
    stubFetch(replies([{ body: link({ User: { id: 1, name: 'A', email: 'a@b.c', photoURL: 'https://s3/x?X-Amz-Security-Token=t' } }) }]));
    const result = await run({ action: createShortLinkAction, props: { domain: DOMAIN_PROP, originalURL: 'https://example.com/a' } });
    expect(JSON.stringify(result)).not.toContain('X-Amz');
    expect(result).toMatchObject({ data: { User: { id: 1, email: 'a@b.c' } } });
  });
});

describe('Greptile follow-ups', () => {
  test('old Domain Statistics ignores leftover dates when a preset period is set', async () => {
    const seen = stubFetch(replies([{ body: { clicks: 1, links: 1 } }]));
    await run({ action: domainStatisticsAction, props: { domainId: DOMAIN_PROP, period: 'last7', startDate: '2026-01-01', endDate: '2026-01-02' } });
    expect(seen[0].url.searchParams.get('period')).toBe('last7');
    expect(seen[0].url.searchParams.get('startDate')).toBeNull();
  });
  test('update-short-link sends tags: [] to clear tags', async () => {
    const seen = stubFetch(replies([{ body: link() }]));
    await run({ action: updateShortLinkAction, props: { domain: DOMAIN_PROP, linkId: 'link_a_b', tags: [] } });
    expect(seen[0].body).toEqual({ tags: [] });
  });
});
