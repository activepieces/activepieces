import { Dimension } from './inputs';

const MAX_REFERRING_URLS = 20;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function bool(value: unknown): boolean {
  return value === true;
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function list({ value, key }: { value: unknown; key: string }): Record<string, unknown>[] {
  return isRecord(value) ? records(value[key]) : [];
}

function site(value: unknown): SiteEntry {
  const record = isRecord(value) ? value : {};
  return { siteUrl: str(record['siteUrl']) ?? '', permissionLevel: str(record['permissionLevel']) ?? '' };
}

function siteFlat(value: unknown): FlatSite {
  const entry = site(value);
  return {
    site_url: entry.siteUrl,
    permission_level: entry.permissionLevel,
    is_verified: entry.permissionLevel !== '' && entry.permissionLevel !== 'siteUnverifiedUser',
  };
}

function permissionLabel(level: string): string {
  return PERMISSION_LABELS[level] ?? level;
}

function analyticsRow({ row, dimensions }: { row: unknown; dimensions: Dimension[] }): FlatRow {
  const record = isRecord(row) ? row : {};
  const keys = strings(record['keys']);
  const columns = Object.fromEntries(dimensions.map((dimension, index) => [DIMENSION_COLUMNS[dimension], keys[index] ?? null]));
  const impressions = num(record['impressions']) ?? 0;
  return {
    ...columns,
    clicks: num(record['clicks']) ?? 0,
    impressions,
    ctr: num(record['ctr']) ?? 0,
    position: impressions > 0 ? num(record['position']) : null,
  };
}

function sitemapFlat(value: unknown): FlatSitemap {
  const record = isRecord(value) ? value : {};
  const contents = records(record['contents']).map((content) => ({ type: str(content['type']), submitted: num(content['submitted']) ?? 0 }));
  return {
    path: str(record['path']),
    type: str(record['type']),
    is_sitemaps_index: bool(record['isSitemapsIndex']),
    is_pending: bool(record['isPending']),
    last_submitted: str(record['lastSubmitted']),
    last_downloaded: str(record['lastDownloaded']),
    errors: num(record['errors']) ?? 0,
    warnings: num(record['warnings']) ?? 0,
    submitted_urls: contents.reduce((total, content) => total + content.submitted, 0),
    contents,
  };
}

function inspection({ body, inspectedUrl }: { body: unknown; inspectedUrl: string }): FlatInspection {
  const result = isRecord(body) && isRecord(body['inspectionResult']) ? body['inspectionResult'] : {};
  const index = isRecord(result['indexStatusResult']) ? result['indexStatusResult'] : {};
  const rich = isRecord(result['richResultsResult']) ? result['richResultsResult'] : {};
  const amp = isRecord(result['ampResult']) ? result['ampResult'] : {};
  const mobile = isRecord(result['mobileUsabilityResult']) ? result['mobileUsabilityResult'] : {};
  const referring = strings(index['referringUrls']);
  const detected = records(rich['detectedItems']);
  const issues = detected.flatMap((group) =>
    records(group['items']).flatMap((item) =>
      records(item['issues']).map((issue) => ({
        type: str(group['richResultType']),
        item: str(item['name']),
        severity: str(issue['severity']),
        message: str(issue['issueMessage']),
      })),
    ),
  );
  return {
    inspected_url: inspectedUrl,
    verdict: str(index['verdict']),
    coverage_state: str(index['coverageState']),
    indexing_state: str(index['indexingState']),
    robots_txt_state: str(index['robotsTxtState']),
    page_fetch_state: str(index['pageFetchState']),
    last_crawl_time: str(index['lastCrawlTime']),
    crawled_as: str(index['crawledAs']),
    google_canonical: str(index['googleCanonical']),
    user_canonical: str(index['userCanonical']),
    sitemaps: strings(index['sitemap']),
    referring_urls: referring.slice(0, MAX_REFERRING_URLS),
    referring_urls_truncated: referring.length > MAX_REFERRING_URLS,
    rich_results_verdict: str(rich['verdict']),
    rich_result_types: detected.map((group) => str(group['richResultType'])).filter((type): type is string => type !== null),
    rich_result_issues: issues,
    amp_verdict: str(amp['verdict']),
    mobile_usability_verdict: str(mobile['verdict']),
    inspection_result_link: str(result['inspectionResultLink']),
  };
}

const PERMISSION_LABELS: Record<string, string> = {
  siteOwner: 'Owner',
  siteFullUser: 'Full',
  siteRestrictedUser: 'Restricted',
  siteUnverifiedUser: 'Unverified',
};

const DIMENSION_COLUMNS: Record<Dimension, string> = {
  date: 'date',
  hour: 'hour',
  query: 'query',
  page: 'page',
  country: 'country',
  device: 'device',
  searchAppearance: 'search_appearance',
};

export const gscShape = {
  isRecord,
  list,
  site,
  siteFlat,
  permissionLabel,
  analyticsRow,
  sitemapFlat,
  inspection,
  MAX_REFERRING_URLS,
};

export type SiteEntry = { siteUrl: string; permissionLevel: string };
export type FlatSite = { site_url: string; permission_level: string; is_verified: boolean };
export type FlatRow = Record<string, string | number | null>;
export type FlatSitemap = {
  path: string | null;
  type: string | null;
  is_sitemaps_index: boolean;
  is_pending: boolean;
  last_submitted: string | null;
  last_downloaded: string | null;
  errors: number;
  warnings: number;
  submitted_urls: number;
  contents: { type: string | null; submitted: number }[];
};
export type FlatInspection = {
  inspected_url: string;
  verdict: string | null;
  coverage_state: string | null;
  indexing_state: string | null;
  robots_txt_state: string | null;
  page_fetch_state: string | null;
  last_crawl_time: string | null;
  crawled_as: string | null;
  google_canonical: string | null;
  user_canonical: string | null;
  sitemaps: string[];
  referring_urls: string[];
  referring_urls_truncated: boolean;
  rich_results_verdict: string | null;
  rich_result_types: string[];
  rich_result_issues: { type: string | null; item: string | null; severity: string | null; message: string | null }[];
  amp_verdict: string | null;
  mobile_usability_verdict: string | null;
  inspection_result_link: string | null;
};
