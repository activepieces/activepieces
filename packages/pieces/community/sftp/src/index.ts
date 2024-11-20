import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import Client from 'ssh2-sftp-client';
import { createFile } from './lib/actions/create-file';
import { uploadFileAction } from './lib/actions/upload-file';
import { readFileContent } from './lib/actions/read-file';
import { newOrModifiedFile } from './lib/triggers/new-modified-file';
import { deleteFolderAction } from './lib/actions/delete-folder';
import { deleteFileAction } from './lib/actions/delete-file';
import { listFolderContentsAction } from './lib/actions/list';
import { createFolderAction } from './lib/actions/create-folder';
import { renameFileOrFolderAction } from './lib/actions/rename-file-or-folder';
export const sftpAuth = PieceAuth.CustomAuth({
  description: 'Enter the authentication details',
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      description: 'The host of the SFTP server',
      required: true,
    }),
    port: Property.Number({
      displayName: 'Port',
      description: 'The port of the SFTP server',
      required: true,
      defaultValue: 22,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The username of the SFTP server',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'The password of the SFTP server',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { host, port, username, password } = auth;
    const sftp = new Client();

    try {
      await sftp.connect({
        host,
        port,
        username,
        password,
        timeout: 10000,
      });
      return {
        valid: true,
      };
    } catch (err) {
      return {
        valid: false,
        error:
          'Connection failed. Please check your credentials and try again.',
      };
    } finally {
      await sftp.end();
    }
  },
  required: true,
});

export const sftp = createPiece({
  displayName: 'SFTP',
  description: 'Secure file transfer protocol',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/sftp.svg',
  categories: [PieceCategory.CORE, PieceCategory.DEVELOPER_TOOLS],
  authors: [
    'Abdallah-Alwarawreh',
    'kishanprmr',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
  ],
  auth: sftpAuth,
  actions: [
    createFile,
    uploadFileAction,
    readFileContent,
    deleteFileAction,
    createFolderAction,
    deleteFolderAction,
    listFolderContentsAction,
    renameFileOrFolderAction,
  ],
  triggers: [newOrModifiedFile],
});
