import { PieceAuth, Property } from '@activepieces/pieces-framework';
import Client from 'ssh2-sftp-client';
import { Client as FTPClient } from 'basic-ftp';
import { getClient, getProtocolBackwardCompatibility, endClient } from './common';

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
    privateKey: PieceAuth.SecretText({
      displayName: 'Private Key',
      description: 'The private key to authenticate with. Either this or password is required.',
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
