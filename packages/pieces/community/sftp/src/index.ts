import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { isNil, PieceCategory } from '@activepieces/shared';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient } from 'basic-ftp';
import { createFile } from './lib/actions/create-file';
import { uploadFileAction } from './lib/actions/upload-file';
import { readFileContent } from './lib/actions/read-file';
import { newOrModifiedFile } from './lib/triggers/new-modified-file';
import { deleteFolderAction } from './lib/actions/delete-folder';
import { deleteFileAction } from './lib/actions/delete-file';
import { listFolderContentsAction } from './lib/actions/list-files';
import { createFolderAction } from './lib/actions/create-folder';
import { renameFileOrFolderAction } from './lib/actions/rename-file-or-folder';

export async function getProtocolBackwardCompatibility(protocol: string | undefined) {
  if (isNil(protocol)) {
    return 'sftp';
  }
  return protocol;
}
export async function getClient<T extends Client | FTPClient>(auth: { protocol: string | undefined, host: string, port: number, allow_unauthorized_certificates: boolean | undefined, username: string, password: string | undefined, privateKey: string | undefined, algorithm: string[] | undefined }): Promise<T> {
  const { protocol, host, port, allow_unauthorized_certificates, username, password, privateKey, algorithm } = auth;
  const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(protocol);
  if (protocolBackwardCompatibility === 'sftp') {
    const sftp = new Client();

    if (auth.password){
      await sftp.connect({
        host,
        port,
        username,
        password,
        timeout: 10000,
      });
    } 
    else if (privateKey) {
      if (!algorithm || algorithm.length === 0) {
        throw new Error('At least one algorithm must be selected for SFTP Private Key authentication.');
      }
      await sftp.connect({
        host,
        port,
        username,
        privateKey: privateKey.replace(/\\n/g, '\n').trim(),
        algorithms: {
          serverHostKey: algorithm 
        }  as Client.ConnectOptions['algorithms'],
        timeout: 10000,
      });
    }

    return sftp as T;
  } else {
    const ftpClient = new FTPClient();
    await ftpClient.access({
      host,
      port,
      user: username,
      password,
      secure: protocolBackwardCompatibility === 'ftps',
      secureOptions: {
        rejectUnauthorized: !(allow_unauthorized_certificates ?? false),
      }
    });
    return ftpClient as T;
  }
}

export async function endClient(client: Client | FTPClient, protocol: string | undefined) {
  const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(protocol);
  if (protocolBackwardCompatibility === 'sftp') {
    await (client as Client).end();
  } else {
    (client as FTPClient).close();
  }
}

export const sftpAuth = PieceAuth.CustomAuth({
  props: {
    protocol: Property.StaticDropdown({
      displayName: 'Protocol',
      description: 'The protocol to use',
      required: false,
      options: {
        options: [
          { value: 'sftp', label: 'SFTP' },
          { value: 'ftp', label: 'FTP' },
          { value: 'ftps', label: 'FTPS' }
        ],
      },
    }),
    allow_unauthorized_certificates: Property.Checkbox({
      displayName: 'Allow Unauthorized Certificates',
      description:
        'Allow connections to servers with self-signed certificates',
      defaultValue: false,
      required: false,
    }),
    host: Property.ShortText({
      displayName: 'Host',
      description: 'The host of the server',
      required: true,
    }),
    port: Property.Number({
      displayName: 'Port',
      description: 'The port of the server',
      required: true,
      defaultValue: 22,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The username to authenticate with',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'The password to authenticate with. Either this or private key is required',
      required: false,
    }),
    privateKey: PieceAuth.SecretText({
      displayName: 'Private Key',
      description: 'The private key to authenticate with. Either this or password is required',
      required: false,
    }),
    algorithm: Property.StaticMultiSelectDropdown({
      displayName: 'Host Key Algorithm',
      description: 'The host key algorithm to use for SFTP Private Key authentication',
      required: false,
      options: {
        options: [
          { value: 'ssh-rsa', label: 'ssh-rsa' },
          { value: 'ssh-dss', label: 'ssh-dss' },
          { value: 'ecdsa-sha2-nistp256', label: 'ecdsa-sha2-nistp256' },
          { value: 'ecdsa-sha2-nistp384', label: 'ecdsa-sha2-nistp384' },
          { value: 'ecdsa-sha2-nistp521', label: 'ecdsa-sha2-nistp521' },
          { value: 'ssh-ed25519', label: 'ssh-ed25519' },
          { value: 'rsa-sha2-256', label: 'rsa-sha2-256' },
          { value: 'rsa-sha2-512', label: 'rsa-sha2-512' }
        ],
      },
    })
  },
  validate: async ({ auth }) => {
  
    if (!auth.password && !auth.privateKey) {
      return {
        valid: false,
        error: 'Either password or private key must be provided for authentication.',
      };
    }

    let client: Client | FTPClient | null = null;
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(auth.protocol);
    try {
      switch (protocolBackwardCompatibility) {
        case 'sftp': {
          client = await getClient<Client>(auth);
          break;
        }
        default: {
          client = await getClient<FTPClient>(auth);
          break;
        }
      }
      return {
        valid: true,
      };
    } catch (err) {
      return {
        valid: false,
        error: (err as Error)?.message,
      };
    } finally {
      if (client) {
        await endClient(client, auth.protocol);
      }
    }
  },
  required: true,
});

export const ftpSftp = createPiece({
  displayName: 'FTP/SFTP',
  description: 'Connect to FTP, FTPS or SFTP servers',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/sftp.svg',
  categories: [PieceCategory.CORE, PieceCategory.DEVELOPER_TOOLS],
  authors: [
    'Abdallah-Alwarawreh',
    'kishanprmr',
    'AbdulTheActivePiecer',
    'khaledmashaly',
    'abuaboud',
    'prasanna2000-max',
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
