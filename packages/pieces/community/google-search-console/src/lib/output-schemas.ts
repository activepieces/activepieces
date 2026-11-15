import { OutputSchema } from '@activepieces/pieces-framework';

const siteEntryFields: OutputSchema['fields'] = [
  { key: 'siteUrl', label: 'Site URL' },
  { key: 'permissionLevel', label: 'Permission Level' },
];

const flatSiteFields: OutputSchema['fields'] = [
  { key: 'site_url', label: 'Site URL' },
  { key: 'permission_level', label: 'Permission Level' },
  { key: 'is_verified', label: 'Is Verified', format: 'boolean' },
];

const rawSitemapFields: OutputSchema['fields'] = [
  { key: 'path', label: 'Sitemap URL', format: 'url' },
  { key: 'type', label: 'Type' },
  { key: 'lastSubmitted', label: 'Last Submitted', format: 'datetime' },
  { key: 'lastDownloaded', label: 'Last Downloaded', format: 'datetime' },
  { key: 'isPending', label: 'Is Pending', format: 'boolean' },
  { key: 'isSitemapsIndex', label: 'Is Sitemap Index', format: 'boolean' },
  { key: 'errors', label: 'Errors', format: 'number' },
  { key: 'warnings', label: 'Warnings', format: 'number' },
  {
    key: 'contents',
    label: 'Contents',
    labelKey: 'type',
    listItems: [
      { key: 'type', label: 'Type' },
      { key: 'submitted', label: 'Submitted URLs', format: 'number' },
    ],
  },
];

const flatSitemapFields: OutputSchema['fields'] = [
  { key: 'path', label: 'Sitemap URL', format: 'url' },
  { key: 'type', label: 'Type' },
  { key: 'is_sitemaps_index', label: 'Is Sitemap Index', format: 'boolean' },
  { key: 'is_pending', label: 'Is Pending', format: 'boolean' },
  { key: 'last_submitted', label: 'Last Submitted', format: 'datetime' },
  { key: 'last_downloaded', label: 'Last Downloaded', format: 'datetime' },
  { key: 'errors', label: 'Errors', format: 'number' },
  { key: 'warnings', label: 'Warnings', format: 'number' },
  { key: 'submitted_urls', label: 'Submitted URLs', format: 'number' },
  {
    key: 'contents',
    label: 'Contents',
    labelKey: 'type',
    listItems: [
      { key: 'type', label: 'Type' },
      { key: 'submitted', label: 'Submitted URLs', format: 'number' },
    ],
  },
];

const analyticsRowFields: OutputSchema['fields'] = [
  { key: 'date', label: 'Date', format: 'date' },
  { key: 'hour', label: 'Hour', format: 'datetime' },
  { key: 'query', label: 'Query' },
  { key: 'page', label: 'Page', format: 'url' },
  { key: 'country', label: 'Country' },
  { key: 'device', label: 'Device' },
  { key: 'search_appearance', label: 'Search Appearance' },
  { key: 'clicks', label: 'Clicks', format: 'number' },
  { key: 'impressions', label: 'Impressions', format: 'number' },
  { key: 'ctr', label: 'CTR', format: 'number', description: 'Click-through rate as a fraction from 0 to 1.' },
  { key: 'position', label: 'Average Position', format: 'number', description: 'Impression-weighted average position (1 is the top); empty when the row has no impressions.' },
];

const inspectionFields: OutputSchema['fields'] = [
  { key: 'inspected_url', label: 'Inspected URL', format: 'url' },
  { key: 'verdict', label: 'Verdict' },
  { key: 'coverage_state', label: 'Coverage State' },
  { key: 'indexing_state', label: 'Indexing State' },
  { key: 'robots_txt_state', label: 'robots.txt State' },
  { key: 'page_fetch_state', label: 'Page Fetch State' },
  { key: 'last_crawl_time', label: 'Last Crawl Time', format: 'datetime' },
  { key: 'crawled_as', label: 'Crawled As' },
  { key: 'google_canonical', label: 'Google Canonical', format: 'url' },
  { key: 'user_canonical', label: 'User Canonical', format: 'url' },
  { key: 'sitemaps', label: 'Sitemaps' },
  { key: 'referring_urls', label: 'Referring URLs' },
  { key: 'referring_urls_truncated', label: 'Referring URLs Truncated', format: 'boolean' },
  { key: 'rich_results_verdict', label: 'Rich Results Verdict' },
  { key: 'rich_result_types', label: 'Rich Result Types' },
  {
    key: 'rich_result_issues',
    label: 'Rich Result Issues',
    labelKey: 'message',
    listItems: [
      { key: 'type', label: 'Rich Result Type' },
      { key: 'item', label: 'Item' },
      { key: 'severity', label: 'Severity' },
      { key: 'message', label: 'Message' },
    ],
  },
  { key: 'amp_verdict', label: 'AMP Verdict' },
  { key: 'mobile_usability_verdict', label: 'Mobile Usability Verdict' },
  { key: 'inspection_result_link', label: 'Search Console Link', format: 'url' },
];

const listSites: OutputSchema = {
  fields: [
    { key: 'siteEntry', label: 'Sites', labelKey: 'siteUrl', listItems: siteEntryFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const getSite: OutputSchema = { fields: flatSiteFields };

const addSite: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'siteUrl', label: 'Site URL' },
    { key: 'permissionLevel', label: 'Permission Level' },
  ],
};

const deleteSite: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'siteUrl', label: 'Site URL' },
  ],
};

const deleteSiteAi: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'site_url', label: 'Site URL' },
  ],
};

const listSitemaps: OutputSchema = {
  fields: [
    { key: 'sitemap', label: 'Sitemaps', labelKey: 'path', listItems: rawSitemapFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const listSitemapsAi: OutputSchema = {
  fields: [
    { key: 'sitemaps', label: 'Sitemaps', labelKey: 'path', listItems: flatSitemapFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const getSitemap: OutputSchema = { fields: flatSitemapFields };

const sitemapChange: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'siteUrl', label: 'Site URL' },
    { key: 'feedpath', label: 'Sitemap URL', format: 'url' },
  ],
};

const sitemapChangeAi: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'site_url', label: 'Site URL' },
    { key: 'feedpath', label: 'Sitemap URL', format: 'url' },
  ],
};

const searchAnalytics: OutputSchema = {
  fields: [
    { key: 'rows', label: 'Rows', listItems: analyticsRowFields },
    { key: 'row_count', label: 'Row Count', format: 'number' },
    {
      key: 'data',
      label: 'Google Response',
      children: [
        { key: 'responseAggregationType', label: 'Aggregation Type' },
        {
          key: 'metadata',
          label: 'Metadata',
          children: [
            { key: 'firstIncompleteDate', label: 'First Incomplete Date', format: 'date' },
            { key: 'firstIncompleteHour', label: 'First Incomplete Hour', format: 'datetime' },
          ],
        },
      ],
    },
    { key: 'status', label: 'HTTP Status', format: 'number' },
  ],
};

const searchAnalyticsAi: OutputSchema = {
  fields: [
    { key: 'rows', label: 'Rows', listItems: analyticsRowFields },
    { key: 'row_count', label: 'Row Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_start_row', label: 'Next Start Row', format: 'number' },
    { key: 'start_date', label: 'Start Date', format: 'date' },
    { key: 'end_date', label: 'End Date', format: 'date' },
    { key: 'data_state', label: 'Data State' },
    { key: 'aggregation_type', label: 'Aggregation Type' },
    { key: 'first_incomplete_date', label: 'First Incomplete Date', format: 'date' },
    { key: 'first_incomplete_hour', label: 'First Incomplete Hour', format: 'datetime' },
  ],
};

const urlInspection: OutputSchema = {
  fields: [
    {
      key: 'inspectionResult',
      label: 'Inspection Result',
      children: [
        { key: 'inspectionResultLink', label: 'Search Console Link', format: 'url' },
        {
          key: 'indexStatusResult',
          label: 'Index Status',
          children: [
            { key: 'verdict', label: 'Verdict' },
            { key: 'coverageState', label: 'Coverage State' },
            { key: 'indexingState', label: 'Indexing State' },
            { key: 'robotsTxtState', label: 'robots.txt State' },
            { key: 'pageFetchState', label: 'Page Fetch State' },
            { key: 'lastCrawlTime', label: 'Last Crawl Time', format: 'datetime' },
            { key: 'crawledAs', label: 'Crawled As' },
            { key: 'googleCanonical', label: 'Google Canonical', format: 'url' },
            { key: 'userCanonical', label: 'User Canonical', format: 'url' },
            { key: 'sitemap', label: 'Sitemaps' },
            { key: 'referringUrls', label: 'Referring URLs' },
          ],
        },
        { key: 'richResultsResult', label: 'Rich Results', children: [{ key: 'verdict', label: 'Verdict' }] },
        { key: 'mobileUsabilityResult', label: 'Mobile Usability', children: [{ key: 'verdict', label: 'Verdict' }] },
      ],
    },
  ],
};

const inspectUrlAi: OutputSchema = { fields: inspectionFields };

export const gscOutputSchemas = {
  listSites,
  getSite,
  addSite,
  deleteSite,
  deleteSiteAi,
  listSitemaps,
  listSitemapsAi,
  getSitemap,
  sitemapChange,
  sitemapChangeAi,
  searchAnalytics,
  searchAnalyticsAi,
  urlInspection,
  inspectUrlAi,
};
