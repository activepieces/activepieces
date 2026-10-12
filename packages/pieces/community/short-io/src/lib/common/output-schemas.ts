import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const linkFields: Fields = [
  { key: 'idString', label: 'Link ID', description: 'Pass this as Link ID to other Short.io steps.' },
  { key: 'linkId', label: 'Link ID (copy)' },
  { key: 'id', label: 'Legacy Numeric ID' },
  { key: 'shortURL', label: 'Short URL', format: 'url' },
  { key: 'secureShortURL', label: 'Secure Short URL', format: 'url' },
  { key: 'originalURL', label: 'Original URL', format: 'url' },
  { key: 'path', label: 'Path' },
  { key: 'title', label: 'Title' },
  { key: 'tags', label: 'Tags' },
  { key: 'DomainId', label: 'Domain ID', format: 'number' },
  { key: 'FolderId', label: 'Folder ID' },
  { key: 'OwnerId', label: 'Owner ID', format: 'number' },
  { key: 'hasPassword', label: 'Password Protected', format: 'boolean', description: 'The password itself is never returned.' },
  { key: 'cloaking', label: 'Cloaking', format: 'boolean' },
  { key: 'redirectType', label: 'Redirect Type' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'expiresAt', label: 'Expires At' },
  { key: 'expiredURL', label: 'Expired Redirect URL', format: 'url' },
  { key: 'clicksLimit', label: 'Clicks Limit', format: 'number' },
  { key: 'ttl', label: 'Scheduled Deletion Time' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'utmSource', label: 'UTM Source' },
  { key: 'utmMedium', label: 'UTM Medium' },
  { key: 'utmCampaign', label: 'UTM Campaign' },
  { key: 'utmTerm', label: 'UTM Term' },
  { key: 'utmContent', label: 'UTM Content' },
  { key: 'androidURL', label: 'Android URL', format: 'url' },
  { key: 'iphoneURL', label: 'iPhone URL', format: 'url' },
  { key: 'splitURL', label: 'Split URL', format: 'url' },
  { key: 'splitPercent', label: 'Split Percent', format: 'number' },
  { key: 'User', label: 'Owner', children: [
    { key: 'id', label: 'User ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', format: 'email' },
  ] },
];

const domainFields: Fields = [
  { key: 'id', label: 'Domain ID', format: 'number', description: 'Pass this (or the hostname) as Domain to other steps.' },
  { key: 'hostname', label: 'Hostname' },
  { key: 'unicodeHostname', label: 'Unicode Hostname' },
  { key: 'state', label: 'State' },
  { key: 'linkType', label: 'Link Type' },
  { key: 'cloaking', label: 'Cloaking', format: 'boolean' },
  { key: 'caseSensitive', label: 'Case Sensitive', format: 'boolean' },
  { key: 'redirect404', label: '404 Redirect', format: 'url' },
  { key: 'httpsLinks', label: 'HTTPS Links', format: 'boolean' },
  { key: 'TeamId', label: 'Team ID', format: 'number' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const scoreList = ({ key, label, valueKey }: { key: string; label: string; valueKey: string }): Fields[number] => ({
  key,
  label,
  listItems: [
    { key: valueKey, label: 'Value' },
    { key: 'score', label: 'Clicks', format: 'number' },
  ],
});

const statsBreakdownFields: Fields = [
  { key: 'interval', label: 'Interval', children: [
    { key: 'startDate', label: 'Start', format: 'datetime' },
    { key: 'endDate', label: 'End', format: 'datetime' },
    { key: 'tz', label: 'Timezone' },
  ] },
  { key: 'clickStatistics', label: 'Clicks Over Time', description: 'datasets[0].data holds {x: date, y: clicks} points.' },
  scoreList({ key: 'country', label: 'Top Countries', valueKey: 'country' }),
  scoreList({ key: 'referer', label: 'Top Referrers', valueKey: 'referer' }),
  scoreList({ key: 'browser', label: 'Top Browsers', valueKey: 'browser' }),
  scoreList({ key: 'os', label: 'Top Operating Systems', valueKey: 'os' }),
  scoreList({ key: 'social', label: 'Top Social Networks', valueKey: 'social' }),
  scoreList({ key: 'city', label: 'Top Cities', valueKey: 'name' }),
];

const domainStatsFields: Fields = [
  { key: 'clicks', label: 'Total Clicks', format: 'number' },
  { key: 'humanClicks', label: 'Human Clicks', format: 'number' },
  { key: 'links', label: 'Links Created', format: 'number' },
  { key: 'clicksPerLink', label: 'Clicks per Link' },
  { key: 'prevClicks', label: 'Clicks in Previous Period', format: 'number' },
  { key: 'prevHumanClicks', label: 'Human Clicks in Previous Period', format: 'number' },
  ...statsBreakdownFields,
];

const wrapped = ({ data, description }: { data: Fields; description: string }): OutputSchema => ({
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'data', label: 'Data', description, children: data },
  ],
});

const clickFields: Fields = [
  { key: 'dt', label: 'Clicked At', format: 'datetime' },
  { key: 'path', label: 'Path' },
  { key: 'url', label: 'Short URL', format: 'url' },
  { key: 'host', label: 'Host' },
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'ref', label: 'Referrer URL' },
  { key: 'refhost', label: 'Referrer Host' },
  { key: 'browser', label: 'Browser' },
  { key: 'os', label: 'Operating System' },
  { key: 'social', label: 'Social Network' },
  { key: 'human', label: 'Human', format: 'boolean' },
  { key: 'st', label: 'HTTP Status', format: 'number' },
  { key: 'utm_source', label: 'UTM Source' },
  { key: 'utm_medium', label: 'UTM Medium' },
  { key: 'utm_campaign', label: 'UTM Campaign' },
  { key: 'ip', label: 'Visitor IP', description: 'Personal data; empty when the domain hides visitor IPs.' },
  { key: 'ua', label: 'User Agent' },
];

export const shortIoSchemas = {
  linkFields,
  domainFields,
  clickFields,
  wrapped,
  legacyLink: wrapped({ data: linkFields, description: 'The Short.io link (password removed).' }),
  legacyLinkList: wrapped({
    data: [
      { key: 'count', label: 'Total Links', format: 'number', description: 'Total links matching on the domain, not just this page.' },
      { key: 'nextPageToken', label: 'Next Page Token', description: 'Pass as Page Token to get the next page; empty on the last page.' },
      { key: 'links', label: 'Links', listItems: linkFields },
    ],
    description: 'The page of links returned by Short.io (passwords removed).',
  }),
  legacyDelete: wrapped({
    data: [
      { key: 'success', label: 'Deleted', format: 'boolean' },
      { key: 'idString', label: 'Link ID' },
    ],
    description: 'Short.io delete response.',
  }),
  legacyCountryRule: wrapped({
    data: [
      { key: 'country', label: 'Country Code' },
      { key: 'originalURL', label: 'Country Redirect URL', format: 'url' },
    ],
    description: 'DRAFT: rule echoed by Short.io (not verified live; needs a Hobby plan).',
  }),
  legacyDomainStats: wrapped({ data: domainStatsFields, description: 'Domain statistics for the period.' }),
  legacyLinkClicks: wrapped({ data: [], description: 'A map of link ID to click count, e.g. {"link_abc": 45}.' }),
  link: { fields: linkFields },
  linkLookup: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'link', label: 'Link', children: linkFields },
    ],
  } satisfies OutputSchema,
  linkList: {
    fields: [
      { key: 'items', label: 'Links', listItems: linkFields },
      { key: 'count', label: 'Count on This Page', format: 'number' },
      { key: 'nextPageToken', label: 'Next Page Token' },
      { key: 'hasMore', label: 'Has More', format: 'boolean', description: 'True when another page exists; pass Next Page Token to get it.' },
    ],
  } satisfies OutputSchema,
  domain: { fields: domainFields } satisfies OutputSchema,
  domainList: {
    fields: [
      { key: 'items', label: 'Domains', listItems: domainFields },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  bulkCreate: {
    fields: [
      { key: 'items', label: 'Created Links', listItems: linkFields },
      { key: 'createdCount', label: 'Created', format: 'number' },
      { key: 'errors', label: 'Failed Items', listItems: [
        { key: 'index', label: 'Input Index', format: 'number' },
        { key: 'originalURL', label: 'Original URL', format: 'url' },
        { key: 'error', label: 'Error' },
      ] },
      { key: 'errorCount', label: 'Failed', format: 'number' },
    ],
  } satisfies OutputSchema,
  archive: {
    fields: [
      { key: 'linkId', label: 'Link ID' },
      { key: 'archived', label: 'Archived', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  deleteLink: {
    fields: [
      { key: 'linkId', label: 'Link ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'alreadyDeleted', label: 'Already Deleted', format: 'boolean', description: 'True when the link did not exist (a repeat call).' },
    ],
  } satisfies OutputSchema,
  tagLinks: {
    fields: [
      { key: 'tag', label: 'Tag' },
      { key: 'linkIds', label: 'Link IDs' },
      { key: 'count', label: 'Links Tagged', format: 'number' },
    ],
  } satisfies OutputSchema,
  qrCode: {
    fields: [
      { key: 'linkId', label: 'Link ID' },
      { key: 'format', label: 'Format' },
      { key: 'fileName', label: 'File Name' },
      { key: 'file', label: 'File', description: 'Stored file reference; pass to steps that take a file.' },
      { key: 'size', label: 'Size (bytes)', format: 'filesize' },
    ],
  } satisfies OutputSchema,
  folderList: {
    fields: [
      { key: 'items', label: 'Folders', listItems: [
        { key: 'id', label: 'Folder ID' },
        { key: 'name', label: 'Name' },
      ] },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  folder: {
    fields: [
      { key: 'id', label: 'Folder ID' },
      { key: 'name', label: 'Name' },
      { key: 'domainId', label: 'Domain ID', format: 'number' },
    ],
  } satisfies OutputSchema,
  countryRuleList: {
    fields: [
      { key: 'linkId', label: 'Link ID' },
      { key: 'items', label: 'Rules', description: 'DRAFT: rule fields not verified live (country targeting needs a Hobby plan).', listItems: [
        { key: 'country', label: 'Country Code' },
        { key: 'originalURL', label: 'Redirect URL', format: 'url' },
      ] },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  countryRule: {
    fields: [
      { key: 'linkId', label: 'Link ID' },
      { key: 'country', label: 'Country Code' },
      { key: 'originalURL', label: 'Redirect URL', format: 'url' },
      { key: 'rule', label: 'Raw Rule', description: 'DRAFT: Short.io response, not verified live (needs a Hobby plan).' },
    ],
  } satisfies OutputSchema,
  countryRuleDelete: {
    fields: [
      { key: 'linkId', label: 'Link ID' },
      { key: 'country', label: 'Country Code' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'alreadyDeleted', label: 'Already Deleted', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  domainStats: { fields: domainStatsFields } satisfies OutputSchema,
  clicks: {
    fields: [
      { key: 'items', label: 'Clicks', listItems: clickFields },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  topLinks: {
    fields: [
      { key: 'items', label: 'Top Links', listItems: [
        { key: 'path', label: 'Path' },
        { key: 'clicks', label: 'Clicks', format: 'number' },
      ] },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  duplicatedLink: {
    fields: [{ key: 'duplicatedFrom', label: 'Copied From Link ID' }, ...linkFields],
  } satisfies OutputSchema,
  folderLookup: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'folder', label: 'Folder', children: [
        { key: 'id', label: 'Folder ID' },
        { key: 'name', label: 'Name' },
        { key: 'domainId', label: 'Domain ID', format: 'number' },
      ] },
    ],
  } satisfies OutputSchema,
  openGraph: {
    fields: [
      { key: 'linkId', label: 'Link ID' },
      { key: 'properties', label: 'Properties', dynamicKey: true, description: 'Map of OpenGraph property (title, description, image, twitter:card…) to value.' },
      { key: 'items', label: 'Property List', listItems: [
        { key: 'property', label: 'Property' },
        { key: 'value', label: 'Value' },
      ] },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  linksByUrl: {
    fields: [
      { key: 'items', label: 'Links', listItems: linkFields },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  trigger: {
    fields: [
      { key: 'id', label: 'Link ID' },
      { key: 'shortURL', label: 'Short URL', format: 'url' },
      { key: 'secureShortURL', label: 'Secure Short URL', format: 'url' },
      { key: 'originalURL', label: 'Original URL', format: 'url' },
      { key: 'path', label: 'Path' },
      { key: 'title', label: 'Title' },
      { key: 'tags', label: 'Tags' },
      { key: 'createdAt', label: 'Created At', format: 'datetime' },
      { key: 'domainId', label: 'Domain ID', format: 'number' },
      { key: 'folderId', label: 'Folder ID' },
      { key: 'hasPassword', label: 'Password Protected', format: 'boolean' },
      { key: 'archived', label: 'Archived', format: 'boolean' },
      { key: 'expiresAt', label: 'Expires At' },
      { key: 'triggerInfo', label: 'Trigger Info', children: [
        { key: 'domain', label: 'Domain' },
        { key: 'detectedAt', label: 'Detected At', format: 'datetime' },
      ] },
      { key: 'raw', label: 'Raw Link', description: 'Full Short.io link object without the password.' },
    ],
  } satisfies OutputSchema,
};
