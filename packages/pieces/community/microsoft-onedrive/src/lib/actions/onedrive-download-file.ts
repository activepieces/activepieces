import { Readable } from 'stream';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { onedriveDownloadFileOutputSchema } from '../output-schemas';

export const onedriveDownloadFile = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_download_file',
  displayName: 'Download File',
  description: 'Download a file by its ID or path.',
  audience: 'ai',
  outputSchema: onedriveDownloadFileOutputSchema,
  classification: 'READ',
  aiMetadata: {
    description:
      'Download the current content of one file together with its metadata, returning a file reference other steps can use. Provide either the item ID (from Search Files and Folders or List Folder Contents) or a path relative to the drive root; use Get File or Folder when you only need metadata, and Convert and Download File to get an Office file as PDF. Folders are rejected. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'File ID',
      description: 'The ID of the file, from Search Files and Folders or List Folder Contents. Provide this or Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The file path relative to the drive root, for example Documents/report.docx. Used when File ID is empty.',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path } = context.propsValue;
    const itemPath = oneDriveApi.itemPath({ itemId, path });
    const item = await oneDriveApi.request<GraphDriveItem>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: itemPath,
    });
    if (item.file === undefined) {
      throw new Error(`"${item.name}" is not a file, so it cannot be downloaded. Use List Folder Contents to see what a folder contains.`);
    }
    const content = await downloadContent({ auth: context.auth, contentPath: `${itemPath}/content` });
    return {
      ...oneDriveApi.toItem(item),
      data: await context.files.write({ fileName: item.name, data: content }),
    };
  },
});

async function downloadContent({
  auth,
  contentPath,
  queryParams,
}: {
  auth: OAuth2PropertyValue;
  contentPath: string;
  queryParams?: QueryParams;
}): Promise<Readable> {
  const cloud = auth.props?.['cloud'];
  const graphBase = `${getGraphBaseUrl(typeof cloud === 'string' ? cloud : undefined)}/v1.0`;
  try {
    const first = await httpClient.sendRequest<Readable>({
      method: HttpMethod.GET,
      url: `${graphBase}${contentPath}`,
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
      headers: { Accept: '*/*' },
      responseType: 'stream',
      followRedirects: false,
    });
    if (first.status < 300) {
      return first.body;
    }
    first.body.destroy();
    const location = first.headers?.['location'];
    const downloadUrl = Array.isArray(location) ? location[0] : location;
    if (!downloadUrl) {
      throw new Error('OneDrive did not return a download location for this file.');
    }
    const download = await httpClient.sendRequest<Readable>({
      method: HttpMethod.GET,
      url: downloadUrl,
      responseType: 'stream',
    });
    return download.body;
  } catch (error) {
    throw new Error(oneDriveApi.describeError(error));
  }
}
