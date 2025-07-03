import { createAction, Property } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient } from 'basic-ftp';
import { endClient, getClient, getProtocolBackwardCompatibility, sftpAuth } from '../..';

async function deleteFolderFTP(client: FTPClient, directoryPath: string, recursive: boolean) {
  if (recursive) {
    await client.removeDir(directoryPath);
  } else {
    await client.removeEmptyDir(directoryPath);
  }
}

async function deleteFolderSFTP(client: Client, directoryPath: string, recursive: boolean) {
  await client.rmdir(directoryPath, recursive);
}

export const deleteFolderAction = createAction({
  auth: sftpAuth,
  name: 'deleteFolder',
  displayName: 'Delete Folder',
  description: 'Deletes an existing folder at given path.',
  props: {
    folderPath: Property.ShortText({
      displayName: 'Folder Path',
      required: true,
      description: 'The path of the folder to delete e.g. `./myfolder`',
    }),
    recursive: Property.Checkbox({
      displayName: 'Recursive',
      defaultValue: false,
      required: false,
      description:
        'Enable this option to delete the folder and all its contents, including subfolders and files.',
    }),
  },
  async run(context) {
    const client = await getClient(context.auth);
    const directoryPath = context.propsValue.folderPath;
    const recursive = context.propsValue.recursive ?? false;
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(context.auth.protocol);
    try {
      switch (protocolBackwardCompatibility) {
        case 'ftps':
        case 'ftp':
          await deleteFolderFTP(client as FTPClient, directoryPath, recursive);
          break;
        default:
        case 'sftp':
          await deleteFolderSFTP(client as Client, directoryPath, recursive);
          break;
      }

      return {
        status: 'success',
      };
    } catch (err) {
      console.error(err);
      return {
        status: 'error',
        error: err,
      };
    } finally {
      await endClient(client, context.auth.protocol);
    }
  },
});
