import {PieceAuth, Property, createPiece} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { Client } from 'basic-ftp';
import { uploadFile } from './lib/actions/upload-file';
import { listFiles } from './lib/actions/list-files';
import { renameFile } from './lib/actions/rename-file';
import { removeAFile } from './lib/actions/remove-a-file';
import { createFolder } from './lib/actions/create-folder';
import { newFile } from './lib/triggers/new-file';
    
    export const ftpAuth = PieceAuth.CustomAuth({
      description: 'Enter the authentication details',
      props: {
        host: Property.ShortText({
          displayName: 'Host',
          description: 'The host of the FTP server',
          required: true,
        }),
        port: Property.Number({
          displayName: 'Port',
          description: 'The port of the FTP server',
          required: true,
          defaultValue: 21,
        }),
        user: Property.ShortText({
          displayName: 'Username',
          description: 'The username of the FTP server',
          required: true,
        }),
        password: PieceAuth.SecretText({
          displayName: 'Password',
          description: 'The password of the FTP server',
          required: true,
        }),
        secure: Property.Checkbox({
          displayName: 'Secure connection',
          description: 'Check if the connection should be FTPs (explicit)',
          required: true,
          defaultValue: false,
        }),
      },
      validate: async ({ auth }) => {
        const { host, port, user, password, secure} = auth;
        const client = new Client();
    
        try {
          await client.access({
            host,
            port,
            user,
            password,
            secure,
          });
          console.log(await client.list());
          return {
            valid: true,
          };
        } catch (err) {
          return {
            valid: false,
            error:
              'Connection failed. Please check your credentials and try again.\n' + err,
          };
        } finally {
          client.close();
        }
      },
      required: true,
    });

    export const ftp = createPiece({
      displayName: "FTP",
      description: "Connect to an FTP server",

      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/ftp.png",
      categories: [PieceCategory.CORE, PieceCategory.DEVELOPER_TOOLS],
      auth: ftpAuth,
      authors: ['bjornvdakker'],
      actions: [uploadFile, listFiles, renameFile, removeAFile, createFolder],
      triggers: [newFile],
    });
    