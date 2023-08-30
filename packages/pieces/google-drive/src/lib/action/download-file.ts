import { googleDriveAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { extension, lookup } from 'mime-types';

export const downloadFile = createAction({
  auth: googleDriveAuth,
  name: 'download_ggdrive_file',
  displayName: 'Download file',
  description: 'Download a selected file from google drive file',
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'The ID of the file to download',
      required: true,
    }),
    mimeType: Property.ShortText({
      displayName: 'MIME type',
      description: 'The MIME type of the file to download',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File name',
      description: 'The indicative name of the file to download',
      required: false,
    }),
  },
  run: async ({ auth, propsValue, files }) => {
    const googledlCall = async (url: string) => {
      const download = await fetch(url, {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      })
        .then((response) =>
          response.ok ? response.blob() : Promise.reject(response)
        )
        .catch((error) =>
          Promise.reject(
            new Error(
              `Error when download file:\n\tDownload file response: ${
                (error as Error).message ?? error
              }`
            )
          )
        );
      
      const extention = '.' + extension(propsValue.mimeType)
      const sourceFileName = propsValue.fileName
      const fileName = ((sourceFileName && lookup(sourceFileName) ? sourceFileName.replace(new RegExp(extention + '$'), '') : sourceFileName)) ?? propsValue.fileId;
      return files.write({
        fileName,
        data: Buffer.from(await download.arrayBuffer()),
      });
    };

    // the google drive API doesn't allowed downloading google documents but we can export them to office formats
    if (
      [
        'application/vnd.google-apps.document',
        'application/vnd.google-apps.spreadsheet',
        'application/vnd.google-apps.presentation',
      ].includes(propsValue.mimeType)
    ) {
      switch (propsValue.mimeType) {
        case 'application/vnd.google-apps.document':
          propsValue.mimeType =
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'application/vnd.google-apps.spreadsheet':
          propsValue.mimeType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'application/vnd.google-apps.presentation':
          propsValue.mimeType =
            'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          break;
      }
      return await googledlCall(
        `https://www.googleapis.com/drive/v3/files/${propsValue.fileId}/export?mimeType=${propsValue.mimeType}`
      );
    } else {
      return await googledlCall(
        `https://www.googleapis.com/drive/v3/files/${propsValue.fileId}?alt=media`
      );
    }
  },
});
