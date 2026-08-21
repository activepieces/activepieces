  import { sftpAuth } from '../auth';
import { endClient, getClient, getProtocolBackwardCompatibility } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient, FTPError } from 'basic-ftp';
import { getSftpError } from './common';

export const createFolderAction = createAction({
  audience: 'both',
  auth: sftpAuth,
  name: 'createFolder',
  displayName: 'Create Folder',
  description: 'Creates a folder at given path.',
  aiMetadata: { description: 'Creates a directory at a given remote path on the connected FTP, FTPS or SFTP server; on SFTP an optional recursive mode also creates any missing parent directories, while FTP/FTPS always ensures the whole path. Use it to prepare a destination directory, for example before a rename or move, noting that Create File from Text and Upload File already create parent directories themselves. Requires the folder path (e.g. ./myfolder); idempotent because it converges on that directory existing.', idempotent: true },
  props: {
    folderPath: Property.ShortText({
      displayName: 'Folder Path',
      required: true,
      description: 'The new folder path e.g. `./myfolder`. For FTP/FTPS, it will create nested folders if necessary.',
    }),
    recursive: Property.Checkbox({
      displayName: 'Recursive',
      defaultValue: false,
      required: false,
      description: 'For SFTP only: Create parent directories if they do not exist',
    }),
  },
  async run(context) {
    const client = await getClient(context.auth.props);
    const directoryPath = context.propsValue.folderPath;
    const recursive = context.propsValue.recursive ?? false;
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(context.auth.props.protocol);
    try {
      switch (protocolBackwardCompatibility) {
        case 'ftps':
        case 'ftp':
          await (client as FTPClient).ensureDir(directoryPath);
          break;
        default:
        case 'sftp':
          await (client as Client).mkdir(directoryPath, recursive);
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
