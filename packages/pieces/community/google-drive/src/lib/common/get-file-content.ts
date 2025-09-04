import {
  FilesService,
  OAuth2PropertyValue,
  OAuth2Props,
  Property,
  ShortTextProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { extension } from 'mime-types';

async function getMimeType(
  auth: OAuth2PropertyValue<OAuth2Props>,
  fileId: string
): Promise<string> {
  const mimeType = (
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType&supportsAllDrives=true`,
      {
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
        },
      }
    ).then((res) => res.json())
  )['mimeType'] as string;
  return mimeType;
}

const googledlCall = async (
  url: string,
  auth: OAuth2PropertyValue<OAuth2Props>,
  fileId: string,
  files: FilesService,
  fileName: string | undefined
) => {
  const mimeType = await getMimeType(auth, fileId);

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

  const extensionResult = extension(mimeType);
  const fileExtension = extensionResult ? '.' + extensionResult : '';
  const srcFileName = fileName ?? fileId + fileExtension;
  // const name =
  //   (srcFileName
  //     ? srcFileName.replace(new RegExp(fileExtension + '$'), '')
  //     : fileId) + fileExtension;

  return files.write({
    fileName: srcFileName,
    data: Buffer.from(await download.arrayBuffer()),
  });
};

export async function downloadFileFromDrive(
  auth: OAuth2PropertyValue<OAuth2Props>,
  files: FilesService,
  fileId: string,
  fileName: string | undefined
): Promise<string> {
  let mimeType = await getMimeType(auth, fileId);

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
      `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${mimeType}&supportsAllDrives=true`,
      auth,
      fileId,
      files,
      fileName
    );
  } else {
    return await googledlCall(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
      auth,
      fileId,
      files,
      fileName
    );
  }
}
