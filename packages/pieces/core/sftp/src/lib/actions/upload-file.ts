import { createAction, Property } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient, FTPError } from 'basic-ftp';
import { endClient, getClient, getProtocolBackwardCompatibility } from '../common';
import { sftpAuth } from '../auth';
import { Readable } from 'stream';
import { getSftpError } from './common';

async function uploadFileToFTP(client: FTPClient, fileName: string, body: Readable) {
  const remoteDirectory = fileName.substring(0, fileName.lastIndexOf('/'));
  await client.ensureDir(remoteDirectory);
  await client.uploadFrom(body, fileName);
}

async function uploadFileToSFTP(client: Client, fileName: string, body: Readable) {
  const remotePathExists = await client.exists(fileName);
  if (!remotePathExists) {
    const remoteDirectory = fileName.substring(0, fileName.lastIndexOf('/'));
    await client.mkdir(remoteDirectory, true);
  }
  await client.put(body, fileName);
  await client.end();
}

export const uploadFileAction = createAction({
  audience: 'both',
  auth: sftpAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Upload a file to the given path.',
  aiMetadata: { description: 'Uploads a file object, typically one produced by an earlier step, to a given path on the connected FTP, FTPS or SFTP server, creating missing parent directories and overwriting any existing file at that path. Use this instead of Create File from Text whenever you have an actual file rather than a string of text. Requires both the file and the destination remote path (e.g. ./myfolder/test.mp3); idempotent, as repeating the upload converges on the same stored file.', idempotent: true },
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
      streaming: true,
    }),
  },
  async run(context) {
    const client = await getClient(context.auth.props);
    const fileName = context.propsValue['fileName'];
    const fileContent = context.propsValue['fileContent'];
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(context.auth.props.protocol);
    try {
      switch (protocolBackwardCompatibility) {
        case 'ftps':
        case 'ftp':
          await uploadFileToFTP(client as FTPClient, fileName, fileContent.body);
          break;
        default:
        case 'sftp':
          await uploadFileToSFTP(client as Client, fileName, fileContent.body);
          break;
      }
      return {
        status: 'success',
      };
    } 
    catch (err) {
      if (err instanceof FTPError) {
        console.error(getSftpError(err.code));
        return {
          status: 'error',
          content: null,
          error: getSftpError(err.code),
        };
      } else {
        return {
          status: 'error',
          content: null,
          error: err
        }
      }
    } finally {
      await endClient(client, context.auth.props.protocol);
    }
  },
});
