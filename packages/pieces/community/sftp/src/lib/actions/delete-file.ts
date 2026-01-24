import { createAction, Property } from '@activepieces/pieces-framework';
import { endClient, getClient, getProtocolBackwardCompatibility, sftpAuth } from '../..';
import { Client as FTPClient, FTPError } from 'basic-ftp';
import Client from 'ssh2-sftp-client';
import { getSftpError } from './common';

async function deleteFileFromFTP(client: FTPClient, filePath: string) {
  await client.remove(filePath);
}

async function deleteFileFromSFTP(client: Client, filePath: string) {
  await client.delete(filePath);
}

export const deleteFileAction = createAction({
  auth: sftpAuth,
  name: 'deleteFile',
  displayName: 'Delete file',
  description: 'Deletes a file at given path.',
  props: {
    filePath: Property.ShortText({
      displayName: 'File Path',
      required: true,
      description: 'The path of the file to delete e.g. `./myfolder/test.mp3`',
    }),
  },
  async run(context) {
    const client = await getClient(context.auth.props);
    const filePath = context.propsValue.filePath;
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(context.auth.props.protocol);
    try {
      switch (protocolBackwardCompatibility) {
        case 'ftps':
        case 'ftp':
          await deleteFileFromFTP(client as FTPClient, filePath);
          break;
        default:
        case 'sftp':
          await deleteFileFromSFTP(client as Client, filePath);
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
          error: getSftpError(err.code),
        };
      } else {
        return {
          status: 'error',
          error: err
        }
      }
    } finally {
      await endClient(client, context.auth.props.protocol);
    }
  },
});
