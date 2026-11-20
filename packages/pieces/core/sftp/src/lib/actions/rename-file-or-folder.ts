import { sftpAuth } from '../auth';
import { endClient, getClient, getProtocolBackwardCompatibility } from '../common';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient, FTPError } from 'basic-ftp';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { getSftpError } from './common';
import { renameFileOrFolderActionOutputSchema } from '../output-schemas';

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
  classification: 'WRITE',
  displayName: 'Rename File or Folder',
  description: 'Rename a file or folder, or move it to another folder.',
  aiMetadata: { description: 'Moves a file or folder on the connected FTP, FTPS or SFTP server from an old remote path to a new one, which covers both renaming in place and, on most servers, relocating the entry into a different directory. Prefer it over reading and re-uploading content, and over a delete-then-create pair, when the bytes do not change. The parent directory of the new path must already exist, so create it with Create Folder first; idempotent in that the entry ends up at the new path, though a repeat call errors because the old path is gone.', idempotent: true },
  props: {
    information: Property.MarkDown({
      value: 'To move the item, put it in another folder in New Path. That folder must already exist.',
      variant: MarkdownVariant.INFO,
    }),
    oldPath: Property.ShortText({
      displayName: 'Old Path',
      required: true,
      description: 'The file or folder to rename or move.',
      placeholder: './reports/draft.csv',
    }),
    newPath: Property.ShortText({
      displayName: 'New Path',
      required: true,
      description: 'Where it should end up, including its name.',
      placeholder: './reports/final.csv',
    }),
  },
  outputSchema: renameFileOrFolderActionOutputSchema,
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
