import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchObjects = createAction({
  auth: googleCloudStorageAuth,
  name: 'search_objects',
  displayName: 'Search Objects',
  description: 'List and search objects in a Google Cloud Storage bucket',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    prefix: Property.ShortText({
      displayName: 'Prefix',
      description: 'Filter objects by prefix',
      required: false,
    }),
    delimiter: Property.ShortText({
      displayName: 'Delimiter',
      description: 'Delimiter for hierarchical listing',
      required: false,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token for pagination',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Maximum number of objects to return',
      required: false,
    }),
    updatedMin: Property.DateTime({
      displayName: 'Updated After',
      description: 'Only return objects updated after this time',
      required: false,
    }),
    updatedMax: Property.DateTime({
      displayName: 'Updated Before',
      description: 'Only return objects updated before this time',
      required: false,
    }),
  },
  async run(context) {
    const { bucket, prefix, delimiter, pageToken, pageSize, updatedMin, updatedMax } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const params = new URLSearchParams();
    if (prefix) params.append('prefix', prefix);
    if (delimiter) params.append('delimiter', delimiter);
    if (pageToken) params.append('pageToken', pageToken);
    if (pageSize) params.append('maxResults', pageSize.toString());

    const path = `/b/${bucket}/o?${params.toString()}`;
    const response = await gcsCommon.makeRequest(HttpMethod.GET, path, auth.access_token);

    let filteredItems = response.items || [];

    if (updatedMin || updatedMax) {
      filteredItems = filteredItems.filter((item: any) => {
        const updated = new Date(item.updated);
        if (updatedMin && updated < new Date(updatedMin)) return false;
        if (updatedMax && updated > new Date(updatedMax)) return false;
        return true;
      });
    }

    return {
      items: filteredItems,
      nextPageToken: response.nextPageToken,
      prefixes: response.prefixes,
    };
  },
});