import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { googleDriveAuth, getAccessToken } from '../auth';
import mime from 'mime-types';
import { common } from '../common';

export const googleDriveUploadFile = createAction({
  auth: googleDriveAuth,
  name: 'upload_gdrive_file',
  description: 'Upload a file in your Google Drive',
  displayName: 'Upload file',
  props: {
    fileName: Property.ShortText({
      displayName: 'File name',
      description: 'The name of the file',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file URL or base64 to upload',
      required: true,
    }),
    parentFolder: common.properties.parentFolder,
    include_team_drives: common.properties.include_team_drives,
    replaceIfExists: Property.Checkbox({
      displayName: 'Replace file if it already exists',
      description:
        'When enabled, if a file with the same name already exists in the destination folder it will be updated instead of creating a duplicate.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      file: fileData,
      fileName,
      parentFolder,
      include_team_drives,
      replaceIfExists,
    } = context.propsValue;

    const accessToken = await getAccessToken(context.auth);
    const mimeType = mime.lookup(fileData.extension ? fileData.extension : '');
    const supportsAllDrives = String(include_team_drives || false);

    if (replaceIfExists) {
      const existingFileId = await findExistingFile({
        accessToken,
        fileName,
        parentFolderId: parentFolder ?? null,
        supportsAllDrives,
      });

      if (existingFileId) {
        return await updateExistingFile({
          accessToken,
          fileId: existingFileId,
          fileData,
          mimeType: mimeType || undefined,
          supportsAllDrives,
        });
      }
    }

    return await createNewFile({
      accessToken,
      fileName,
      fileData,
      parentFolder: parentFolder ?? null,
      mimeType: mimeType || undefined,
      supportsAllDrives,
    });
  },
});

async function findExistingFile({
  accessToken,
  fileName,
  parentFolderId,
  supportsAllDrives,
}: {
  accessToken: string;
  fileName: string;
  parentFolderId: string | null;
  supportsAllDrives: string;
}): Promise<string | null> {
  const nameEscaped = fileName.replace(/'/g, "\\'");
  let q = `name = '${nameEscaped}' and trashed = false`;
  if (parentFolderId) {
    q += ` and '${parentFolderId}' in parents`;
  }

  const searchResult = await httpClient.sendRequest<{
    files: { id: string }[];
  }>({
    method: HttpMethod.GET,
    url: 'https://www.googleapis.com/drive/v3/files',
    queryParams: {
      q,
      fields: 'files(id)',
      supportsAllDrives,
      includeItemsFromAllDrives: supportsAllDrives,
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  });

  const files = searchResult.body.files;
  return files && files.length > 0 ? files[0].id : null;
}

async function updateExistingFile({
  accessToken,
  fileId,
  fileData,
  mimeType,
  supportsAllDrives,
}: {
  accessToken: string;
  fileId: string;
  fileData: { base64: string; extension?: string };
  mimeType?: string;
  supportsAllDrives: string;
}): Promise<unknown> {
  const fileBuffer = Buffer.from(fileData.base64, 'base64');
  const form = new FormData();
  const meta: Record<string, unknown> = {};
  if (mimeType) meta['mimeType'] = mimeType;
  form.append('Metadata', Buffer.from(JSON.stringify(meta), 'utf-8'), {
    contentType: 'application/json',
  });
  form.append('Media', fileBuffer);

  const result = await httpClient.sendRequest({
    method: HttpMethod.PATCH,
    url: `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
    queryParams: {
      uploadType: 'multipart',
      supportsAllDrives,
    },
    body: form,
    headers: {
      ...form.getHeaders(),
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  });

  return result.body;
}

async function createNewFile({
  accessToken,
  fileName,
  fileData,
  parentFolder,
  mimeType,
  supportsAllDrives,
}: {
  accessToken: string;
  fileName: string;
  fileData: { base64: string; extension?: string };
  parentFolder: string | null;
  mimeType?: string;
  supportsAllDrives: string;
}): Promise<unknown> {
  const meta: Record<string, unknown> = { name: fileName };
  if (mimeType) meta['mimeType'] = mimeType;
  if (parentFolder) meta['parents'] = [parentFolder];

  const metaBuffer = Buffer.from(JSON.stringify(meta), 'utf-8');
  const fileBuffer = Buffer.from(fileData.base64, 'base64');

  const form = new FormData();
  form.append('Metadata', metaBuffer, { contentType: 'application/json' });
  form.append('Media', fileBuffer);

  const result = await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: `https://www.googleapis.com/upload/drive/v3/files`,
    queryParams: {
      uploadType: 'multipart',
      supportsAllDrives,
    },
    body: form,
    headers: {
      ...form.getHeaders(),
    },
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: accessToken,
    },
  });

  return result.body;
}
