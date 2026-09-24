import { Readable } from 'stream';
import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, QueryParams, httpClient } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { onedriveDownloadFileAsFormatOutputSchema } from '../output-schemas';

export const onedriveDownloadFileAsFormat = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_download_file_as_format',
  displayName: 'Convert and Download File',
  description: 'Convert a file to PDF, HTML or JPG and download the result.',
  audience: 'ai',
  outputSchema: onedriveDownloadFileAsFormatOutputSchema,
  classification: 'READ',
  aiMetadata: {
    description:
      'Have OneDrive convert one file to another format and download the converted copy; the stored file is not changed. Typical use is Word, Excel or PowerPoint to PDF; HTML works only for Loop, Fluid and whiteboard files, and JPG needs both Width and Height. Provide the item ID (from Search Files and Folders or List Folder Contents) or a path; use Download File for the original bytes. Read-only and safe to retry.',
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
    format: Property.StaticDropdown({
      displayName: 'Target Format',
      required: true,
      defaultValue: 'pdf',
      options: {
        disabled: false,
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'HTML (Loop, Fluid and whiteboard files only)', value: 'html' },
          { label: 'JPG (requires Width and Height)', value: 'jpg' },
        ],
      },
    }),
    width: Property.Number({
      displayName: 'Width',
      description: 'Image width in pixels. Required when Target Format is JPG.',
      required: false,
    }),
    height: Property.Number({
      displayName: 'Height',
      description: 'Image height in pixels. Required when Target Format is JPG.',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path, format, width, height } = context.propsValue;
    const conversion = buildConversionParams({ format, width, height });
    const itemPath = oneDriveApi.itemPath({ itemId, path });
    const item = await oneDriveApi.request<GraphDriveItem>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: itemPath,
    });
    if (item.file === undefined) {
      throw new Error(`"${item.name}" is not a file, so it cannot be converted.`);
    }
    const content = await downloadContent({
      auth: context.auth,
      contentPath: `${itemPath}/content`,
      queryParams: conversion,
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${message} OneDrive may not support converting this file type to ${format.toUpperCase()}.`);
    });
    const fileName = `${item.name.replace(/\.[^.]*$/, '')}.${format}`;
    return {
      ...oneDriveApi.toItem(item),
      convertedFormat: format,
      convertedFileName: fileName,
      data: await context.files.write({ fileName, data: content }),
    };
  },
});

function buildConversionParams({
  format,
  width,
  height,
}: {
  format: string;
  width?: number;
  height?: number;
}): QueryParams {
  if (format !== 'jpg') {
    return { format };
  }
  if (!isPositive(width) || !isPositive(height)) {
    throw new Error('Width and Height are both required, as positive numbers, when Target Format is JPG.');
  }
  return { format, width: String(Math.floor(width)), height: String(Math.floor(height)) };
}

function isPositive(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1;
}

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
