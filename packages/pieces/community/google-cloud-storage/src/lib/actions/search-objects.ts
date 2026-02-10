import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { googleCloudStorageAuth } from '../common/auth';
import { gcsCommon } from '../common/client';
import { bucketDropdown, projectIdProperty } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchObjects = createAction({
  auth: googleCloudStorageAuth,
  name: 'search_objects',
  displayName: 'Search Objects',
  description: 'Search objects by criteria. Perfect for finding files in your bucket.',
  props: {
    projectId: projectIdProperty,
    bucket: bucketDropdown,
    prefix: Property.ShortText({
      displayName: 'Prefix',
      description: 'Filter objects whose names begin with this prefix',
      required: false,
    }),
    matchGlob: Property.ShortText({
      displayName: 'Glob Pattern',
      description: 'Glob pattern to filter results (e.g., "folder/*", "backup-*.txt")',
      required: false,
    }),
    delimiter: Property.ShortText({
      displayName: 'Delimiter',
      description: 'Delimiter for hierarchical listing (commonly "/")',
      required: false,
    }),
    includeFoldersAsPrefixes: Property.Checkbox({
      displayName: 'Include Folders',
      description: 'Include empty folders and managed folders in results',
      required: false,
    }),
    versions: Property.Checkbox({
      displayName: 'Include Versions',
      description: 'List all versions of objects as distinct results',
      required: false,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'Token for pagination (from previous response)',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of objects to return (recommended: ≤1000)',
      required: false,
    }),
  },
  async run(context) {
    const {
      bucket,
      prefix,
      matchGlob,
      delimiter,
      includeFoldersAsPrefixes,
      versions,
      pageToken,
      maxResults
    } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;

    const params = new URLSearchParams();
    if (prefix) params.append('prefix', prefix);
    if (matchGlob) params.append('matchGlob', matchGlob);
    if (delimiter) params.append('delimiter', delimiter);
    if (includeFoldersAsPrefixes) params.append('includeFoldersAsPrefixes', 'true');
    if (versions) params.append('versions', 'true');
    if (pageToken) params.append('pageToken', pageToken);
    if (maxResults) params.append('maxResults', maxResults.toString());

    const path = `/b/${bucket}/o?${params.toString()}`;

    try {
      const response = await gcsCommon.makeRequest(HttpMethod.GET, path, auth.access_token);

      return {
        success: true,
        bucket,
        items: response.items || [],
        nextPageToken: response.nextPageToken,
        prefixes: response.prefixes || [],
        totalItems: response.items?.length || 0,
      };
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error('Access denied. You need storage.objects.list permission to search objects in this bucket.');
      }
      if (error.response?.status === 404) {
        throw new Error(`Bucket "${bucket}" not found.`);
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid search parameters. Check your prefix, glob pattern, or other filters.');
      }
      throw new Error(`Failed to search objects: ${error.message || 'Unknown error'}`);
    }
  },
});