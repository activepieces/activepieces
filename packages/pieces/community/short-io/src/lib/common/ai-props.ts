import { Property } from '@activepieces/pieces-framework';

export const shortIoAiProps = {
  domain: () =>
    Property.ShortText({
      displayName: 'Domain',
      description: 'Short.io domain hostname (e.g. link.example.com) or its numeric domain ID. Use List Domains to see them.',
      required: true,
    }),
  linkId: () =>
    Property.ShortText({
      displayName: 'Link ID',
      description: 'Short.io link ID: the idString field of a link, e.g. link_8yXK_034ebx7JWAtAAK3vFcl6ye.',
      required: true,
    }),
  folderId: () =>
    Property.ShortText({
      displayName: 'Folder ID',
      description: 'Optional folder ID (use List Folders to find it).',
      required: false,
    }),
  period: (description: string) =>
    Property.StaticDropdown({
      displayName: 'Period',
      description,
      required: false,
      defaultValue: 'last30',
      options: {
        disabled: false,
        options: [
          { label: 'Today', value: 'today' },
          { label: 'Yesterday', value: 'yesterday' },
          { label: 'Last 7 Days', value: 'last7' },
          { label: 'Last 30 Days', value: 'last30' },
          { label: 'This Week', value: 'week' },
          { label: 'This Month', value: 'month' },
          { label: 'Last Month', value: 'lastmonth' },
          { label: 'All Time', value: 'total' },
          { label: 'Custom Date Range', value: 'custom' },
        ],
      },
    }),
  startDate: () =>
    Property.ShortText({
      displayName: 'Start Date',
      description: 'First day (YYYY-MM-DD) when Period is "custom".',
      required: false,
    }),
  endDate: () =>
    Property.ShortText({
      displayName: 'End Date',
      description: 'Last day (YYYY-MM-DD) when Period is "custom".',
      required: false,
    }),
  timezone: () =>
    Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone for day boundaries, e.g. UTC or America/New_York. Defaults to UTC.',
      required: false,
    }),
};
