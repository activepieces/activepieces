import { HttpMethod } from '@activepieces/pieces-common';
import { gscClient, GscAuth } from './client';
import { AnalyticsQuery, Dimension } from './inputs';
import { gscShape } from './shape';

async function listSites({ auth }: { auth: GscAuth }): Promise<{ siteEntry: SiteEntryList; count: number }> {
  const response = await gscClient.request<unknown>({ auth, method: HttpMethod.GET, path: ['webmasters', 'v3', 'sites'], operation: 'list sites' });
  const siteEntry = gscShape.list({ value: response.body, key: 'siteEntry' }).map(gscShape.site);
  return { siteEntry, count: siteEntry.length };
}

async function getSite({ auth, siteUrl }: { auth: GscAuth; siteUrl: string }) {
  const response = await gscClient.request<unknown>({ auth, method: HttpMethod.GET, path: gscClient.sitePath(siteUrl), operation: `read the property ${siteUrl}` });
  return gscShape.site(response.body);
}

async function addSite({ auth, siteUrl }: { auth: GscAuth; siteUrl: string }): Promise<{ success: true; siteUrl: string; permissionLevel: string | null }> {
  await gscClient.request<unknown>({ auth, method: HttpMethod.PUT, path: gscClient.sitePath(siteUrl), operation: `add the property ${siteUrl}` });
  try {
    const site = await getSite({ auth, siteUrl });
    return { success: true, siteUrl, permissionLevel: site.permissionLevel || null };
  } catch {
    return { success: true, siteUrl, permissionLevel: null };
  }
}

async function deleteSite({ auth, siteUrl }: { auth: GscAuth; siteUrl: string }): Promise<void> {
  await gscClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: gscClient.sitePath(siteUrl), operation: `remove the property ${siteUrl}` });
}

async function listSitemaps({ auth, siteUrl, sitemapIndex }: { auth: GscAuth; siteUrl: string; sitemapIndex?: string }): Promise<Record<string, unknown>[]> {
  const response = await gscClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: [...gscClient.sitePath(siteUrl), 'sitemaps'],
    query: { sitemapIndex },
    operation: `list the sitemaps of ${siteUrl}`,
  });
  return gscShape.list({ value: response.body, key: 'sitemap' });
}

async function getSitemap({ auth, siteUrl, feedpath }: { auth: GscAuth; siteUrl: string; feedpath: string }): Promise<unknown> {
  const response = await gscClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: [...gscClient.sitePath(siteUrl), 'sitemaps', encodeURIComponent(feedpath)],
    operation: `read the sitemap ${feedpath}`,
  });
  return response.body;
}

async function submitSitemap({ auth, siteUrl, feedpath }: { auth: GscAuth; siteUrl: string; feedpath: string }): Promise<void> {
  await gscClient.request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: [...gscClient.sitePath(siteUrl), 'sitemaps', encodeURIComponent(feedpath)],
    operation: `submit the sitemap ${feedpath}`,
  });
}

async function deleteSitemap({ auth, siteUrl, feedpath }: { auth: GscAuth; siteUrl: string; feedpath: string }): Promise<void> {
  await gscClient.request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: [...gscClient.sitePath(siteUrl), 'sitemaps', encodeURIComponent(feedpath)],
    operation: `delete the sitemap ${feedpath}`,
  });
}

async function searchAnalytics({ auth, siteUrl, query }: { auth: GscAuth; siteUrl: string; query: AnalyticsQuery }): Promise<AnalyticsResult> {
  const response = await gscClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: [...gscClient.sitePath(siteUrl), 'searchAnalytics', 'query'],
    body: query,
    operation: `query search analytics for ${siteUrl}`,
  });
  const body = gscShape.isRecord(response.body) ? response.body : {};
  const rawRows = gscShape.list({ value: body, key: 'rows' });
  const dimensions: Dimension[] = query.dimensions ?? [];
  return {
    status: response.status,
    data: { ...body, rows: rawRows },
    rows: rawRows.map((row) => gscShape.analyticsRow({ row, dimensions })),
  };
}

async function inspectUrl({ auth, siteUrl, inspectionUrl, languageCode }: { auth: GscAuth; siteUrl: string; inspectionUrl: string; languageCode?: string }): Promise<unknown> {
  const response = await gscClient.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: ['v1', 'urlInspection', 'index:inspect'],
    body: { inspectionUrl, siteUrl, ...(languageCode ? { languageCode } : {}) },
    operation: `inspect ${inspectionUrl}`,
  });
  return response.body;
}

export const gscOps = {
  listSites,
  getSite,
  addSite,
  deleteSite,
  listSitemaps,
  getSitemap,
  submitSitemap,
  deleteSitemap,
  searchAnalytics,
  inspectUrl,
};

type SiteEntryList = { siteUrl: string; permissionLevel: string }[];
type AnalyticsResult = {
  status: number;
  data: Record<string, unknown> & { rows: Record<string, unknown>[] };
  rows: Record<string, string | number | null>[];
};
