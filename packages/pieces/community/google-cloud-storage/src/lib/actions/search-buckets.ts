import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchBuckets = createAction({
  auth: googleCloudStorageAuth,
  name: 'search_buckets',
  displayName: 'Search Buckets',
  description: 'Search buckets by name. Perfect for finding buckets in your project.',
  props: {
    projectId: projectIdProperty,
    prefix: Property.ShortText({
      displayName: 'Name Prefix',
      description: 'Filter buckets whose names begin with this prefix',
      required: false,
    }),
    includeSoftDeleted: Property.Checkbox({
      displayName: 'Include Soft-Deleted',
      description: 'Include soft-deleted bucket versions in results',
      required: false,
    }),
    projection: Property.StaticDropdown({
      displayName: 'Projection',
      description: 'Set of properties to return',
      required: false,
      options: {
        options: [
          { label: 'No ACLs (faster)', value: 'noAcl' },
          { label: 'Full (includes ACLs)', value: 'full' },
        ],
      },
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token for pagination (from previous response)',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of buckets to return',
      required: false,
    }),
  },
  async run(context) {
    const {
      projectId,
      prefix,
      includeSoftDeleted,
      projection,
      pageToken,
      maxResults
    } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const params = new URLSearchParams();
    params.append('project', projectId!);
    if (prefix) params.append('prefix', prefix);
    if (includeSoftDeleted) params.append('softDeleted', 'true');
    if (projection) params.append('projection', projection);
    if (pageToken) params.append('pageToken', pageToken);
    if (maxResults) params.append('maxResults', maxResults.toString());

    const path = `/b?${params.toString()}`;

    try {
      const response = await gcsCommon.makeRequest(HttpMethod.GET, path, auth.access_token);

      return {
        success: true,
        projectId,
        items: response.items || [],
        nextPageToken: response.nextPageToken,
        totalBuckets: response.items?.length || 0,
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Access denied. You need storage.buckets.list permission to search buckets in this project.');
      }
      if (error.response?.status === 404) {
        throw new Error(`Project "${projectId}" not found or you don't have access to it.`);
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid search parameters. Check your project ID and other filters.');
      }
      throw new Error(`Failed to search buckets: ${error.message || 'Unknown error'}`);
    }
  },
});