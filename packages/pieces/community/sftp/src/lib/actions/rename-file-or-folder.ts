import { endClient, sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient } from 'basic-ftp';
import { getClient, getProtocolBackwardCompatibility } from '../..';
import { MarkdownVariant } from '@activepieces/shared';

async function renameFTP(client: FTPClient, oldPath: string, newPath: string) {
  await client.rename(oldPath, newPath);
}

async function renameSFTP(client: Client, oldPath: string, newPath: string) {
  await client.rename(oldPath, newPath);
  await client.end();
}

export const renameFileOrFolderAction = createAction({
  auth: sftpAuth,
  name: 'renameFileOrFolder',
  displayName: 'Rename File or Folder',
  description: 'Renames a file or folder at given path.',
  props: {
    information: Property.MarkDown({
      value: 'Depending on the server you can also use this to move a file to another directory, as long as the directory exists.',
      variant: MarkdownVariant.INFO,
    }),
    oldPath: Property.ShortText({
      displayName: 'Old Path',
      required: true,
      description:
        'The path of the file or folder to rename e.g. `./myfolder/test.mp3`',
    }),
    newPath: Property.ShortText({
      displayName: 'New Path',
      required: true,
      description:
        'The new path of the file or folder e.g. `./myfolder/new-name.mp3`',
    }),
  },
  async run(context) {
    const client = await getClient(context.auth);
    const oldPath = context.propsValue.oldPath;
    const newPath = context.propsValue.newPath;
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(context.auth.protocol);
    try {
      switch (protocolBackwardCompatibility) {
        case 'ftps':
        case 'ftp':
          await renameFTP(client as FTPClient, oldPath, newPath);
          break;
        default:
        case 'sftp':
          await renameSFTP(client as Client, oldPath, newPath);
          break;
      }

      return {
        status: 'success',
      };
    } catch (err) {
      return {
        status: 'error',
        error: err,
      };
    } finally {
      await endClient(client, context.auth.protocol);
    } 
  },
});
