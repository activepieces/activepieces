import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchBuckets = createAction({
  auth: googleCloudStorageAuth,
  name: 'search_buckets',
  displayName: 'Search Buckets',
  description: 'List and search buckets in a Google Cloud project',
  props: {
    projectId: projectIdProperty,
    nameFilter: Property.ShortText({
      displayName: 'Name Filter',
      description: 'Filter buckets by name (partial match)',
      required: false,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token for pagination',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of buckets to return',
      required: false,
    }),
  },
  async run(context) {
    const { projectId, nameFilter, pageToken, pageSize } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const params = new URLSearchParams();
    params.append('project', projectId);
    if (pageToken) params.append('pageToken', pageToken);
    if (pageSize) params.append('maxResults', pageSize.toString());

    const path = `/b?${params.toString()}`;
    const response = await gcsCommon.makeRequest(HttpMethod.GET, path, auth.access_token);

    let filteredItems = response.items || [];

    if (nameFilter) {
      filteredItems = filteredItems.filter((bucket: any) =>
        bucket.name.toLowerCase().includes(nameFilter.toLowerCase())
      );
    }

    return {
      items: filteredItems,
      nextPageToken: response.nextPageToken,
    };
  },
});