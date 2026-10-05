import { Readable } from 'stream';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { onedriveDownloadItemVersionOutputSchema } from '../output-schemas';

export const onedriveDownloadItemVersion = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_download_item_version',
  displayName: 'Download File Version',
  description: 'Download the content of a previous version of a file.',
  audience: 'ai',
  outputSchema: onedriveDownloadItemVersionOutputSchema,
  classification: 'READ',
  aiMetadata: {
    description:
      'Download the content of one earlier version of a file without restoring it. Get the version ID from List File Versions and provide the file ID (from Search Files and Folders or List Folder Contents) or a path; OneDrive does not serve the current version this way, so use Download File for the latest content. Read-only and safe to retry.',
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
    versionId: Property.ShortText({
      displayName: 'Version ID',
      description: 'Earlier version ID from List File Versions (not the current one).',
      required: true,
    }),
  },
  async run(context) {
    const { itemId, path } = context.propsValue;
    const versionId = context.propsValue.versionId.trim();
    const itemPath = oneDriveApi.itemPath({ itemId, path });
    const item = await oneDriveApi.request<GraphDriveItem>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: itemPath,
      queryParams: { $select: 'id,name,file' },
    });
    if (item.file === undefined) {
      throw new Error(`"${item.name}" is not a file, so it has no versions to download.`);
    }
    const content = await downloadContent({
      auth: context.auth,
      versionPath: `${itemPath}/versions/${encodeURIComponent(versionId)}`,
    });
    return {
      itemId: item.id,
      name: item.name,
      versionId,
      mimeType: item.file.mimeType ?? null,
      data: await context.files.write({ fileName: item.name, data: content }),
    };
  },
});

async function downloadContent({
  auth,
  versionPath,
}: {
  auth: OAuth2PropertyValue;
  versionPath: string;
}): Promise<Readable> {
  const version = await oneDriveApi.request<{ '@microsoft.graph.downloadUrl'?: string }>({
    auth,
    method: HttpMethod.GET,
    path: versionPath,
  });
  const downloadUrl = version['@microsoft.graph.downloadUrl'];
  if (!downloadUrl) {
    throw new Error('OneDrive did not return a download URL for this version.');
  }
  try {
    const download = await httpClient.sendRequest<Readable>({
      method: HttpMethod.GET,
      url: downloadUrl,
      headers: { Accept: '*/*' },
      responseType: 'stream',
    });
    return download.body;
  } catch (error) {
    throw new Error(oneDriveApi.describeError(error));
  }
}
