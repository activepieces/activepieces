import { createAction, Property } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient } from 'basic-ftp';
import { endClient, getClient, getProtocolBackwardCompatibility, sftpAuth } from '../..';
import { Readable } from 'stream';

async function uploadFileToFTP(client: FTPClient, fileName: string, fileContent: { data: any }) {
  const remoteDirectory = fileName.substring(0, fileName.lastIndexOf('/'));
  await client.ensureDir(remoteDirectory);
  await client.uploadFrom(Readable.from(fileContent.data), fileName);
}

async function uploadFileToSFTP(client: Client, fileName: string, fileContent: { data: any }) {
  const remotePathExists = await client.exists(fileName);
  if (!remotePathExists) {
    const remoteDirectory = fileName.substring(0, fileName.lastIndexOf('/'));
    await client.mkdir(remoteDirectory, true);
  }
  await client.put(fileContent.data, fileName);
  await client.end();
}

export const uploadFileAction = createAction({
  auth: sftpAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Upload a file to the given path.',
  props: {
    fileName: Property.ShortText({
      displayName: 'File Path',
      required: true,
      description:
        'The path on the sftp server to store the file. e.g. `./myfolder/test.mp3`',
    }),
    fileContent: Property.File({
      displayName: 'File content',
      required: true,
    }),
  },
  async run(context) {
    const client = await getClient(context.auth);
    const fileName = context.propsValue['fileName'];
    const fileContent = context.propsValue['fileContent'];
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(context.auth.protocol);
    try {
      switch (protocolBackwardCompatibility) {
        case 'ftps':
        case 'ftp':
          await uploadFileToFTP(client as FTPClient, fileName, fileContent);
          break;
        default:
        case 'sftp':
          await uploadFileToSFTP(client as Client, fileName, fileContent);
          break;
      }
      return {
        status: 'success',
      };
    } catch (error) {
      console.error(error);
      return {
        status: 'error',
      };
    } finally {
      await endClient(client, context.auth.protocol);
    }
  },
});
