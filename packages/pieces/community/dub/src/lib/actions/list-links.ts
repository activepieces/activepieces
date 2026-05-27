import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dubAuth, DUB_API_BASE } from '../auth';
import { DubLink } from '../common/common';
export const listLinks = createAction({
  name: 'list_links',
  displayName: 'List Links',
  description: 'Retrieve a paginated list of links in your Dub workspace.',
  auth: dubAuth,
  props: {
    domain: Property.ShortText({
      displayName: 'Domain Filter',
      description: 'Filter by a specific domain (e.g. `dub.sh`). Leave empty to return all domains.',
      required: false,
    }),
    tagNames: Property.Array({
      displayName: 'Tag Name Filter',
      description: 'Filter by one or more tag names.',
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search links by their URL, title, or slug.',
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID Filter',
      description: 'Filter links created by a specific user ID.',
      required: false,
    }),
    showArchived: Property.Checkbox({
      displayName: 'Include Archived Links',
      description: 'Whether to include archived links in the results.',
      required: false,
      defaultValue: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (starts at 1).',
      required: false,
      defaultValue: 1,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of links to return per page (1–100). Default is 100.',
      required: false,
      defaultValue: 100,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort results by.',
      required: false,
      defaultValue: 'createdAt',
      options: {
        options: [
          { label: 'Created At (newest first)', value: 'createdAt' },
          { label: 'Clicks (most clicks first)', value: 'clicks' },
          { label: 'Last Clicked', value: 'lastClicked' },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Use URLSearchParams so we can append multiple tagName values
    const params = new URLSearchParams();

    if (propsValue.domain) params.set('domain', propsValue.domain);
    if (propsValue.search) params.set('search', propsValue.search);
    if (propsValue.userId) params.set('userId', propsValue.userId);
    if (propsValue.showArchived) params.set('showArchived', 'true');
    if (propsValue.page) params.set('page', String(propsValue.page));
    if (propsValue.pageSize) params.set('pageSize', String(propsValue.pageSize));
    if (propsValue.sort) params.set('sort', propsValue.sort);

    // Append each tag as a separate tagName param so all survive serialisation
    if (propsValue.tagNames && (propsValue.tagNames as string[]).length > 0) {
      for (const tag of propsValue.tagNames as string[]) {
        params.append('tagName', tag);
      }
    }

    const queryString = params.toString();
    const url = `${DUB_API_BASE}/links${queryString ? `?${queryString}` : ''}`;

    const response = await httpClient.sendRequest<DubLink[]>({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
