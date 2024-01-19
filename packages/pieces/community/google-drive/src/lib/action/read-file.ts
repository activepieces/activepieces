import { googleDriveAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { extension } from 'mime-types';

export const readFile = createAction({
  auth: googleDriveAuth,
  name: 'read-file',
  displayName: 'Read file',
  description: 'Read a selected file from google drive file',
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'File ID coming from | New File -> id |',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'Destination File name',
      required: false,
    }),
  },
  run: async ({ auth, propsValue, files }) => {
    let mimeType = (
      await fetch(
        `https://www.googleapis.com/drive/v3/files/${propsValue.fileId}?fields=mimeType`,
        {
          headers: {
            Authorization: `Bearer ${auth.access_token}`,
          },
        }
      ).then((res) => res.json())
    )['mimeType'] as string;

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

      const extention = '.' + extension(mimeType);
      const srcFileName = propsValue.fileName;
      const fileName =
        (srcFileName
          ? srcFileName.replace(new RegExp(extention + '$'), '')
          : propsValue.fileId) + extention;
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
      ].includes(mimeType)
    ) {
      switch (mimeType) {
        case 'application/vnd.google-apps.document':
          mimeType =
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case 'application/vnd.google-apps.spreadsheet':
          mimeType =
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'application/vnd.google-apps.presentation':
          mimeType =
            'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          break;
      }
      return await googledlCall(
        `https://www.googleapis.com/drive/v3/files/${propsValue.fileId}/export?mimeType=${mimeType}`
      );
    } else {
      return await googledlCall(
        `https://www.googleapis.com/drive/v3/files/${propsValue.fileId}?alt=media`
      );
    }
  },
});
