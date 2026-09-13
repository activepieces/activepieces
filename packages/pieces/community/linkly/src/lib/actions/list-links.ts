import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linklyAuth } from '../auth';
import { linklyApiCall, LinklyLinkList } from '../common/client';
import { workspaceDropdown } from '../common/props';

export const listLinks = createAction({
  auth: linklyAuth,
  name: 'list_links',
  displayName: 'Find Links',
  description: 'Search or page through the links in a workspace, with click counts.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists links in a Linkly workspace with pagination, free-text search (matches name, slug and destination) and sorting, including click totals per link. Use to find a link by name or destination, or to enumerate links. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    workspace_id: workspaceDropdown,
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Matches link name, slug and destination URL.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
    page_size: Property.Number({
      displayName: 'Page size',
      description: 'Links per page (max 100).',
      required: false,
      defaultValue: 25,
    }),
    sort_by: Property.StaticDropdown({
      displayName: 'Sort by',
      required: false,
      defaultValue: 'id',
      options: {
        disabled: false,
        options: [
          { label: 'Newest first (ID)', value: 'id' },
          { label: 'Name', value: 'name' },
          { label: 'Total clicks', value: 'clicks_total' },
          { label: 'Clicks in last 30 days', value: 'clicks_thirty_days' },
          { label: 'Clicks today', value: 'clicks_today' },
        ],
      },
    }),
    sort_dir: Property.StaticDropdown({
      displayName: 'Sort direction',
      required: false,
      defaultValue: 'desc',
      options: {
        disabled: false,
        options: [
          { label: 'Descending', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { workspace_id, search, page, page_size, sort_by, sort_dir } = propsValue;
    return linklyApiCall<LinklyLinkList>({
      token: auth.secret_text,
      method: HttpMethod.GET,
      path: `/workspace/${workspace_id}/list_links`,
      query: { search, page, page_size, sort_by, sort_dir },
    });
  },
});
