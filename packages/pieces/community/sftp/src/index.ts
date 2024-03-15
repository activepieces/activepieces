import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import Client from 'ssh2-sftp-client';
import { createFile } from './lib/actions/create-file';
import { readFileContent } from './lib/actions/read-file';
import { newOrModifiedFile } from './lib/triggers/new-modified-file';
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

  minimumSupportedRelease: '0.7.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/sftp.svg',
  categories: [PieceCategory.CORE, PieceCategory.DEVELOPER_TOOLS],
  authors: ["Abdallah-Alwarawreh","kishanprmr","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  auth: sftpAuth,
  actions: [createFile, readFileContent],
  triggers: [newOrModifiedFile],
});
