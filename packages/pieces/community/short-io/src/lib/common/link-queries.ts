import { HttpMethod } from '@activepieces/pieces-common';
import { shortIoClient, ShortIoAuthValue } from './client';
import { shortIoLinks } from './links';

async function expand({ auth, hostname, path }: { auth: ShortIoAuthValue; hostname: string; path: string }): Promise<Record<string, unknown> | null> {
  try {
    const response = await shortIoClient.request({ auth, method: HttpMethod.GET, path: '/links/expand', query: { domain: hostname, path } });
    return shortIoLinks.scrubLink(response);
  } catch (error) {
    if (shortIoClient.errorStatus(error) === 404) {
      return null;
    }
    return shortIoClient.rethrowWithHint({ error, hints: {} });
  }
}

async function getById({ auth, linkId, domainId }: { auth: ShortIoAuthValue; linkId: unknown; domainId?: number }): Promise<Record<string, unknown> | null> {
  const id = shortIoClient.seg({ value: linkId, label: 'Link ID' });
  try {
    const response = await shortIoClient.request({ auth, method: HttpMethod.GET, path: `/links/${id}`, query: { domainId } });
    return shortIoLinks.scrubLink(response);
  } catch (error) {
    if (shortIoClient.errorStatus(error) === 404) {
      return null;
    }
    return shortIoClient.rethrowWithHint({ error, hints: {} });
  }
}

async function listPage({ auth, domainId, query }: {
  auth: ShortIoAuthValue;
  domainId: number;
  query: Record<string, string | number | undefined>;
}): Promise<{ links: Record<string, unknown>[]; nextPageToken: string | null; count: number | null }> {
  try {
    const response = await shortIoClient.request({
      auth,
      method: HttpMethod.GET,
      path: '/api/links',
      query: { ...query, domain_id: domainId },
    });
    const record = shortIoLinks.isRecord(response) ? response : {};
    const token = record['nextPageToken'];
    return {
      links: shortIoLinks.scrubLinks(record['links']),
      nextPageToken: typeof token === 'string' && token ? token : null,
      count: typeof record['count'] === 'number' ? record['count'] : null,
    };
  } catch (error) {
    return shortIoClient.rethrowWithHint({ error, hints: { 400: 'Short.io rejected the link filters.' } });
  }
}

export const shortIoLinkQueries = { expand, getById, listPage };
