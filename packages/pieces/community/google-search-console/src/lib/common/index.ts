import { Property } from '@activepieces/pieces-framework';
import { googleSearchConsoleAuth } from '../auth';
import { DATA_STATES, DIMENSIONS } from './inputs';
import { gscOps } from './operations';
import { gscShape } from './shape';

function siteDropdown({ includeUnverified }: { includeUnverified: boolean }) {
  return Property.Dropdown({
    auth: googleSearchConsoleAuth,
    displayName: 'Site URL',
    description: includeUnverified
      ? 'The Search Console property. Unverified properties are listed too.'
      : 'The Search Console property. Only properties you have verified access to are listed.',
    required: true,
    refreshers: [],
    refreshOnSearch: false,
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Google account first.' };
      }
      try {
        const { siteEntry } = await gscOps.listSites({ auth });
        const sites = siteEntry
          .filter((site) => site.siteUrl !== '' && (includeUnverified || site.permissionLevel !== 'siteUnverifiedUser'))
          .sort((a, b) => a.siteUrl.localeCompare(b.siteUrl));
        if (sites.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: includeUnverified
              ? 'No Search Console properties found for this Google account.'
              : 'No verified Search Console properties found for this Google account. Verify the property in Search Console first.',
          };
        }
        return {
          disabled: false,
          options: sites.map((site) => ({ label: `${site.siteUrl} (${gscShape.permissionLabel(site.permissionLevel)})`, value: site.siteUrl })),
        };
      } catch (error) {
        return failed({ error, what: 'properties' });
      }
    },
  });
}

function sitemapDropdown() {
  return Property.Dropdown({
    auth: googleSearchConsoleAuth,
    displayName: 'Sitemap',
    description: 'A sitemap submitted to the selected property.',
    required: true,
    refreshers: ['siteUrl'],
    refreshOnSearch: false,
    options: async ({ auth, siteUrl }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Google account first.' };
      }
      if (typeof siteUrl !== 'string' || siteUrl.length === 0) {
        return { disabled: true, options: [], placeholder: 'Select a Site URL first.' };
      }
      try {
        const sitemaps = await gscOps.listSitemaps({ auth, siteUrl });
        const paths = sitemaps.map((sitemap) => sitemap['path']).filter((path): path is string => typeof path === 'string' && path.length > 0);
        if (paths.length === 0) {
          return { disabled: true, options: [], placeholder: 'No sitemaps are submitted for this property.' };
        }
        return { disabled: false, options: paths.map((path) => ({ label: path, value: path })) };
      } catch (error) {
        return failed({ error, what: 'sitemaps' });
      }
    },
  });
}

function failed({ error, what }: { error: unknown; what: string }) {
  const message = error instanceof Error ? error.message : 'unknown error';
  return { disabled: true, options: [], placeholder: `Could not load ${what}: ${message}`.slice(0, 400) };
}

function aiSiteUrl() {
  return Property.ShortText({
    displayName: 'Site URL',
    description:
      'The Search Console property exactly as List Sites returns it: a URL-prefix property ends with "/" (e.g. "https://www.example.com/"), a domain property starts with "sc-domain:" (e.g. "sc-domain:example.com").',
    required: true,
  });
}

function feedpathText() {
  return Property.ShortText({
    displayName: 'Sitemap URL',
    description: 'The full URL of the sitemap, e.g. "https://www.example.com/sitemap.xml".',
    required: true,
  });
}

function dataState() {
  return Property.StaticDropdown({
    displayName: 'Data State',
    description:
      'Which data to include. "final" (default) has only finalized data; "all" adds fresh, still-changing data from the last days; "hourly_all" is required for the hour dimension and is selected automatically when you group by hour.',
    required: false,
    options: { options: DATA_STATES.map((value) => ({ label: value, value })) },
  });
}

function searchType() {
  return Property.StaticDropdown({
    displayName: 'Search Type',
    description: 'The Google surface to report on. Defaults to "web". Discover and Google News have no search queries.',
    required: false,
    options: {
      options: [
        { label: 'Web', value: 'web' },
        { label: 'Discover', value: 'discover' },
        { label: 'Google News', value: 'googleNews' },
        { label: 'News', value: 'news' },
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
      ],
    },
  });
}

function aggregationType() {
  return Property.StaticDropdown({
    displayName: 'Aggregation Type',
    description: 'How results are aggregated. Defaults to "auto". "byProperty" cannot be used with the page dimension or a page filter.',
    required: false,
    options: {
      options: [
        { label: 'Auto', value: 'auto' },
        { label: 'By Page', value: 'byPage' },
        { label: 'By Property', value: 'byProperty' },
        { label: 'By News Showcase Panel', value: 'byNewsShowcasePanel' },
      ],
    },
  });
}

function filtersProp() {
  return Property.Array({
    displayName: 'Filters',
    description: 'Optional filters. All filters are combined with AND.',
    required: false,
    properties: {
      dimension: Property.StaticDropdown({
        displayName: 'Dimension',
        description: 'The dimension to filter by.',
        required: true,
        options: {
          options: [
            { label: 'Query', value: 'query' },
            { label: 'Page', value: 'page' },
            { label: 'Country (ISO 3166-1 alpha-3, e.g. "usa")', value: 'country' },
            { label: 'Device', value: 'device' },
            { label: 'Search Appearance', value: 'searchAppearance' },
          ],
        },
      }),
      operator: Property.StaticDropdown({
        displayName: 'Operator',
        description: 'How the expression is compared. Regex operators use RE2 syntax.',
        required: true,
        options: {
          options: [
            { label: 'Equals', value: 'equals' },
            { label: 'Not Equals', value: 'notEquals' },
            { label: 'Contains', value: 'contains' },
            { label: 'Not Contains', value: 'notContains' },
            { label: 'Including Regex', value: 'includingRegex' },
            { label: 'Excluding Regex', value: 'excludingRegex' },
          ],
        },
      }),
      expression: Property.ShortText({
        displayName: 'Expression',
        description: 'The value to compare with. Country uses ISO 3166-1 alpha-3 codes (e.g. "usa"); device is DESKTOP, MOBILE or TABLET.',
        required: true,
      }),
    },
  });
}

function dimensionsMulti() {
  return Property.StaticMultiSelectDropdown({
    displayName: 'Dimensions',
    description: 'Group results by these dimensions, in this order. Leave empty for one totals row. "hour" covers only the last few days.',
    required: false,
    options: { options: DIMENSIONS.map((value) => ({ label: value, value })) },
  });
}

export const commonProps = {
  siteUrl: siteDropdown({ includeUnverified: false }),
  siteUrlIncludingUnverified: siteDropdown({ includeUnverified: true }),
  sitemap: sitemapDropdown(),
  aiSiteUrl,
  feedpathText,
  dataState,
  searchType,
  aggregationType,
  filters: filtersProp,
  dimensionsMulti,
};
