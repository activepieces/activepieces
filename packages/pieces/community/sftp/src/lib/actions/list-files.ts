import { endClient, sftpAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient, FTPError } from 'basic-ftp';
import { getClient, getProtocolBackwardCompatibility } from '../..';
import { getSftpError } from './common';
import { unknown } from 'zod';

async function listSFTP(client: Client, directoryPath: string) {
  const contents = await client.list(directoryPath);
  await client.end();
  return contents;
}

async function listFTP(client: FTPClient, directoryPath: string) {
  const contents = await client.list(directoryPath);
  return contents.map(item => ({
    type: item.type === 1 ? 'd' : '-',
    name: item.name,
    size: item.size,
    modifyTime: item.modifiedAt,
    accessTime: item.modifiedAt,  // FTP doesn't provide access time
    rights: {
      user: item.permissions || '',
      group: '',
      other: ''
    },
    owner: '',
    group: ''
  }));
}

export const listFolderContentsAction = createAction({
  auth: sftpAuth,
  name: 'listFolderContents',
  displayName: 'List Folder Contents',
  description: 'Lists the contents of a given folder.',
  props: {
    directoryPath: Property.ShortText({
      displayName: 'Directory Path',
      required: true,
      description: 'The path of the folder to list e.g. `./myfolder`',
    }),
  },
  async run(context) {
    const client = await getClient(context.auth.props);
    const directoryPath = context.propsValue.directoryPath;
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(context.auth.props.protocol);
    try {
      let contents;
      switch (protocolBackwardCompatibility) {
        case 'ftps':
        case 'ftp':
          contents = await listFTP(client as FTPClient, directoryPath);
          break;
        default:
        case 'sftp':
          contents = await listSFTP(client as Client, directoryPath);
          break;
      }

      return {
        status: 'success',
        contents: contents,
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
