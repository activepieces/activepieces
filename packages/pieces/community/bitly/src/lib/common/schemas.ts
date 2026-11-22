import { OutputSchema } from '@activepieces/pieces-framework';

const bitlinkFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Bitlink ID', description: 'Domain and back-half, e.g. bit.ly/abc123. Use it as the Bitlink ID in other steps.' },
  { key: 'link', label: 'Short URL', format: 'url' },
  { key: 'long_url', label: 'Long URL', format: 'url' },
  { key: 'title', label: 'Title' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'created_by', label: 'Created By' },
  { key: 'tags', label: 'Tags' },
  { key: 'custom_bitlinks', label: 'Custom Bitlinks' },
  { key: 'deeplinks', label: 'Deeplinks' },
  { key: 'references', label: 'References', children: [{ key: 'group', label: 'Group URL', format: 'url' }] },
];

const qrCodeFields: OutputSchema['fields'] = [
  { key: 'qrcode_id', label: 'QR Code ID' },
  { key: 'title', label: 'Title' },
  { key: 'group_guid', label: 'Group GUID' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'is_customized', label: 'Customized', format: 'boolean' },
  { key: 'created', label: 'Created At', format: 'datetime' },
  { key: 'modified', label: 'Modified At', format: 'datetime' },
  { key: 'serialized_content', label: 'Encoded Content', format: 'url' },
  {
    key: 'destination',
    label: 'Destination',
    children: [
      { key: 'long_url', label: 'Long URL', format: 'url' },
      { key: 'bitlink_id', label: 'Bitlink ID' },
    ],
  },
];

const clicksFields: OutputSchema['fields'] = [
  { key: 'total_clicks', label: 'Total Clicks', format: 'number' },
  { key: 'unit', label: 'Unit' },
  { key: 'units', label: 'Units', format: 'number' },
  { key: 'unit_reference', label: 'Unit Reference', format: 'datetime' },
];

export const bitlinkOutputSchema: OutputSchema = { fields: bitlinkFields };

export const qrCodeOutputSchema: OutputSchema = { fields: qrCodeFields };

export const clicksSummaryOutputSchema: OutputSchema = { fields: clicksFields };

export const groupsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'groups',
      label: 'Groups',
      labelKey: 'name',
      listItems: [
        { key: 'guid', label: 'Group GUID' },
        { key: 'name', label: 'Name' },
        { key: 'organization_guid', label: 'Organization GUID' },
        { key: 'is_active', label: 'Active', format: 'boolean' },
        { key: 'role', label: 'Role' },
        { key: 'bsds', label: 'Branded Domains' },
      ],
    },
  ],
};

export const bitlinkListOutputSchema: OutputSchema = {
  fields: [
    { key: 'links', label: 'Bitlinks', labelKey: 'id', listItems: bitlinkFields },
    { key: 'next_cursor', label: 'Next Cursor', description: 'Pass as Cursor to get the next page; empty when there are no more.' },
  ],
};

export const qrCodeListOutputSchema: OutputSchema = {
  fields: [
    { key: 'qr_codes', label: 'QR Codes', labelKey: 'qrcode_id', listItems: qrCodeFields },
    { key: 'next_cursor', label: 'Next Cursor', description: 'Pass as Cursor to get the next page; empty when there are no more.' },
  ],
};

export const newBitlinkOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Bitlink ID' },
    { key: 'link', label: 'Short URL', format: 'url' },
    { key: 'longUrl', label: 'Long URL', format: 'url' },
    { key: 'title', label: 'Title' },
    { key: 'tags', label: 'Tags' },
    { key: 'isArchived', label: 'Archived', format: 'boolean' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'modifiedAt', label: 'Modified At', format: 'datetime' },
    { key: 'customBitlinks', label: 'Custom Bitlinks' },
    { key: 'references', label: 'References', children: [{ key: 'group', label: 'Group URL', format: 'url' }] },
    { key: 'rawLinkData', label: 'Raw Bitlink', children: bitlinkFields },
    {
      key: 'triggerInfo',
      label: 'Trigger Info',
      children: [
        { key: 'detectedAt', label: 'Detected At', format: 'datetime' },
        { key: 'source', label: 'Source' },
        { key: 'type', label: 'Type' },
      ],
    },
  ],
};

export type BitlyLink = {
  id: string;
  link?: string;
  long_url?: string;
  title?: string | null;
  tags?: string[];
  archived?: boolean;
  created_at?: string;
  modified_at?: string;
  custom_bitlinks?: string[];
  references?: { group?: string };
};

export type BitlyGroup = {
  guid: string;
  name: string;
  organization_guid?: string;
  is_active?: boolean;
  role?: string;
  bsds?: unknown[];
};

export type BitlyPagination = {
  search_after?: string;
  next?: string;
  size?: number;
  total?: number;
};
