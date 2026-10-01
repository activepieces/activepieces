import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphIdentity, oneDriveApi } from '../common/graph-api';
import { onedriveListItemVersionsOutputSchema } from '../output-schemas';

export const onedriveListItemVersions = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_list_item_versions',
  displayName: 'List File Versions',
  description: 'List the saved versions of a file.',
  audience: 'ai',
  outputSchema: onedriveListItemVersionsOutputSchema,
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'List the version history of one file, newest first, with each version ID, size, modification time and who made it, one page per call. Use it to get the version ID that Download File Version and Restore File Version need. Provide the item ID (from Search Files and Folders or List Folder Contents) or a path; retention is controlled by the account or admin, so the list can be short. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'File ID',
      description: 'File ID from Search or List Folder Contents. Or use Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'File path from the drive root. Used when File ID is empty.',
      placeholder: 'Documents/report.docx',
      required: false,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'nextPageToken from the previous call. Empty for the first page.',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path, pageToken } = context.propsValue;
    const token = pageToken?.trim();
    const response = await oneDriveApi.request<GraphVersionPage>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: token
        ? token
        : `${oneDriveApi.itemPath({ itemId, path })}/versions`,
    });
    const items = response.value.map((version) => ({
      versionId: version.id,
      lastModifiedDateTime: version.lastModifiedDateTime ?? null,
      size: version.size ?? null,
      lastModifiedByName: version.lastModifiedBy?.user?.displayName ?? null,
      lastModifiedByEmail: version.lastModifiedBy?.user?.email ?? null,
    }));
    return {
      items,
      count: items.length,
      nextPageToken: response['@odata.nextLink'] ?? null,
    };
  },
});

type GraphVersionPage = {
  value: {
    id: string;
    lastModifiedDateTime?: string;
    size?: number;
    lastModifiedBy?: GraphIdentity;
  }[];
  '@odata.nextLink'?: string;
};
