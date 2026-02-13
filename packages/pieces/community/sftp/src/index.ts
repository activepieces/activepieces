import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { isNil, PieceCategory } from '@activepieces/shared';
import Client from 'ssh2-sftp-client';
import { ServerHostKeyAlgorithm } from 'ssh2';
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
export async function getClient<T extends Client | FTPClient>(auth: { protocol: string | undefined, host: string, port: number, allow_unauthorized_certificates: boolean | undefined, allow_anonymous_login: boolean | undefined, username: string, password: string | undefined, privateKey: string | undefined, algorithm: ServerHostKeyAlgorithm[] | string[] | undefined }): Promise<T> {
  const { protocol, host, port, allow_unauthorized_certificates, allow_anonymous_login, username, password, privateKey, algorithm } = auth;
  const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(protocol);
  if (protocolBackwardCompatibility === 'sftp') {
    const sftp = new Client();

    if (privateKey) {
      // Handle literal \n strings (from users who manually escaped newlines)
      let processedKey = privateKey
        .replace(/\\r\\n/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
      
      // Handle case where browser input converts newlines to spaces
      // Detect if key is on a single line (no newlines) but has PEM markers
      if (!processedKey.includes('\n') && processedKey.match(/-----BEGIN [A-Z0-9 ]+ KEY-----.*-----END [A-Z0-9 ]+ KEY-----/)) {
        // Split on spaces that appear after key markers or base64 content
        // PEM format: header, optional encryption info, blank line, base64 (64 chars/line), footer
        processedKey = processedKey
          // Add newline after BEGIN header
          .replace(/(-----BEGIN [A-Z0-9 ]+ KEY-----)\s+/, '$1\n')
          // Add newline after Proc-Type header
          .replace(/(Proc-Type:\s*\S+)\s+/, '$1\n')
          // Add newline after DEK-Info header (followed by blank line)
          .replace(/(DEK-Info:\s*\S+)\s+/, '$1\n\n')
          // Add newline before END footer
          .replace(/\s+(-----END [A-Z0-9 ]+ KEY-----)/, '\n$1');
        
        // Now handle the base64 content - split into 64-char lines
        const beginMatch = processedKey.match(/(-----BEGIN [A-Z0-9 ]+ KEY-----\n(?:Proc-Type:[^\n]+\n)?(?:DEK-Info:[^\n]+\n\n)?)/);
        const endMatch = processedKey.match(/(\n-----END [A-Z0-9 ]+ KEY-----)/);
        if (beginMatch && endMatch) {
          const header = beginMatch[1];
          const footer = endMatch[1];
          const base64Content = processedKey
            .replace(header, '')
            .replace(footer, '')
            .replace(/\s+/g, ''); // Remove all whitespace from base64
          
          // Split base64 into 64-character lines
          const lines = base64Content.match(/.{1,64}/g) || [];
          processedKey = header + lines.join('\n') + footer;
        }
      }
      
      const connectOptions: Client.ConnectOptions = {
        host,
        port,
        username,
        privateKey: processedKey,
        timeout: 10000,
      };
      if (password) {
        connectOptions.passphrase = password;
      }
      if (algorithm && algorithm.length > 0) {
        connectOptions.algorithms = {
          serverHostKey: algorithm as ServerHostKeyAlgorithm[]
        };
      }
      await sftp.connect(connectOptions);
    }
    else if (password) {
      await sftp.connect({
        host,
        port,
        username,
        password,
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
    allow_anonymous_login: Property.Checkbox({
      displayName: 'Allow Anonymous Login',
      description:
        'Allow anonymous login to FTP servers (only applicable for FTP/FTPS)',
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
      description: 'The password to authenticate with. Either this or private key is required. When using a private key, this field is used as the passphrase to decrypt the key.',
      required: false,
    }),
    privateKey: Property.LongText({
      displayName: 'Private Key',
      description: 'The private key to authenticate with. Either this or password is required. You can paste the key directly with newlines.',
      required: false,
    }),
    algorithm: Property.StaticMultiSelectDropdown({
      displayName: 'Host Key Algorithm',
      description: 'The host key algorithm to use for SFTP connection. Only needed if you want to override the default algorithms (e.g., to support ssh-dss).',
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
    let client: Client | FTPClient | null = null;
    const protocolBackwardCompatibility = await getProtocolBackwardCompatibility(auth.protocol);
    try {
      if (!auth.privateKey && !auth.password && !auth.allow_anonymous_login) {
        return {
          valid: false,
          error: 'Either password or private key must be provided for non-anonymous authentication.',
        };
      }

      switch (protocolBackwardCompatibility) {
        case 'sftp': {
          if (auth.allow_anonymous_login) {
            return {
              valid: false,
              error: 'Anonymous login is not supported for SFTP protocol.',
            };
          }

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
  logoUrl: 'https://cdn.activepieces.com/pieces/new-core/sftp.svg',
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
