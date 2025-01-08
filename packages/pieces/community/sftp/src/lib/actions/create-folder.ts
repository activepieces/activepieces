  import { endClient, getClient, getProtocolBackwardCompatibility, sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient } from 'basic-ftp';

export const createFolderAction = createAction({
  auth: sftpAuth,
  name: 'createFolder',
  displayName: 'Create Folder',
  description: 'Creates a folder at given path.',
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
    const client = await getClient(context.auth);
    const directoryPath = context.propsValue.folderPath;
    const recursive = context.propsValue.recursive ?? false;
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(context.auth.protocol);
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
