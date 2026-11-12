import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAiProps } from '../common/ai-props';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { shortIoTargeting } from '../common/targeting';

const MAX_BULK_LINKS = 1000;
const ALLOWED_KEYS = ['originalURL', 'path', 'title', 'tags', 'utmSource', 'utmMedium', 'utmCampaign', 'utmTerm', 'utmContent', 'expiresAt', 'expiredURL', 'redirectType', 'androidURL', 'iphoneURL', 'cloaking'];

function normalizeLinks(value: unknown): Record<string, unknown>[] {
  const list: unknown = typeof value === 'string' ? parseJson(value) : value;
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error('Links must be a non-empty JSON array of objects like {"originalURL": "https://…", "path": "optional-slug"}.');
  }
  if (list.length > MAX_BULK_LINKS) {
    throw new Error(`Short.io accepts at most ${MAX_BULK_LINKS} links per bulk request (got ${list.length}).`);
  }
  return list.map((item, index) => {
    const record = typeof item === 'string' ? { originalURL: item } : item;
    if (!shortIoLinks.isRecord(record)) {
      throw new Error(`Link #${index + 1} must be an object or a URL string.`);
    }
    const picked = Object.fromEntries(ALLOWED_KEYS.filter((key) => record[key] !== undefined && record[key] !== null && record[key] !== '').map((key) => [key, record[key]]));
    return { ...picked, originalURL: shortIoTargeting.httpUrl({ value: record['originalURL'], label: `Link #${index + 1} originalURL` }) };
  });
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Links must be valid JSON.');
  }
}

export const createLinksBulkAction = createAction({
  auth: shortIoAuth,
  name: 'create_links_bulk',
  displayName: 'Create Short Links (Bulk)',
  description: 'Create up to 1,000 short links on one domain in a single request.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates up to 1000 short links on one domain in a single call. Each item needs originalURL and may set path, title, tags, UTM fields, expiresAt and redirectType. Returns the created links plus per-item errors. Not idempotent: a repeat call without fixed paths creates duplicates.',
    idempotent: false,
  },
  outputSchema: shortIoSchemas.bulkCreate,
  props: {
    domain: shortIoAiProps.domain(),
    links: Property.Json({
      displayName: 'Links',
      description:
        'JSON array of links, e.g. [{"originalURL": "https://example.com/a", "path": "a"}, {"originalURL": "https://example.com/b"}]. Allowed keys: originalURL (required), path, title, tags, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, expiresAt, expiredURL, redirectType, androidURL, iphoneURL, cloaking.',
      required: true,
    }),
    folderId: shortIoAiProps.folderId(),
    allowDuplicates: Property.Checkbox({
      displayName: 'Allow Duplicates',
      description: 'Create a new link even when one already points to the same URL.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const links = normalizeLinks(propsValue.links);
    const domain = await shortIoLinks.resolveDomain({ auth, input: propsValue.domain });
    try {
      const response = await shortIoClient.request({
        auth,
        method: HttpMethod.POST,
        path: '/links/bulk',
        body: {
          domain: domain.hostname,
          links,
          allowDuplicates: propsValue.allowDuplicates === true,
          ...(propsValue.folderId?.trim() ? { folderId: propsValue.folderId.trim() } : {}),
        },
      });
      const results = Array.isArray(response) ? response : [];
      const items = results.filter((item) => shortIoLinks.isRecord(item) && typeof item['idString'] === 'string').map(shortIoLinks.scrubLink);
      const errors = results.flatMap((item, index) =>
        shortIoLinks.isRecord(item) && typeof item['idString'] === 'string'
          ? []
          : [{ index, originalURL: links[index]?.['originalURL'], error: shortIoClient.vendorMessage({ responseBody: item, fallback: 'not created' }) }],
      );
      return { items, createdCount: items.length, errors, errorCount: errors.length };
    } catch (error) {
      return shortIoClient.rethrowWithHint({ error, hints: { 400: 'Short.io rejected the bulk request.' } });
    }
  },
});
