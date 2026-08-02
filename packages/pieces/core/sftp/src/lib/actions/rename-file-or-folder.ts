import { sftpAuth } from '../auth';
import { endClient, getClient, getProtocolBackwardCompatibility } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient, FTPError } from 'basic-ftp';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { getSftpError } from './common';

async function renameFTP(client: FTPClient, oldPath: string, newPath: string) {
  await client.rename(oldPath, newPath);
}

async function renameSFTP(client: Client, oldPath: string, newPath: string) {
  await client.rename(oldPath, newPath);
  await client.end();
}

export const renameFileOrFolderAction = createAction({
  audience: 'both',
  auth: sftpAuth,
  name: 'renameFileOrFolder',
  displayName: 'Rename File or Folder',
  description: 'Renames a file or folder at given path.',
  aiMetadata: { description: 'Moves a file or folder on the connected FTP, FTPS or SFTP server from an old remote path to a new one, which covers both renaming in place and, on most servers, relocating the entry into a different directory. Prefer it over reading and re-uploading content, and over a delete-then-create pair, when the bytes do not change. The parent directory of the new path must already exist, so create it with Create Folder first; idempotent in that the entry ends up at the new path, though a repeat call errors because the old path is gone.', idempotent: true },
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
    const client = await getClient(context.auth.props);
    const oldPath = context.propsValue.oldPath;
    const newPath = context.propsValue.newPath;
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(context.auth.props.protocol);
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
