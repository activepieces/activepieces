import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { Config, NodeSSH } from 'node-ssh';

import actions from './lib/actions';

export const sshAuth = PieceAuth.CustomAuth({
  description: 'Enter the authentication details',
  props: {
    host: Property.ShortText({
      displayName: 'Host',
      description: 'The host of the SSH server',
      required: true,
    }),
    port: Property.Number({
      displayName: 'Port',
      description: 'The port of the SSH server',
      required: true,
      defaultValue: 22,
    }),
    method: Property.StaticDropdown({
      displayName: 'Method',
      options: {
        options: [
          {
            label: 'Password',
            value: 'password',
          },
          {
            label: 'Private Key',
            value: 'private-key',
          },
        ],
      },
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The username for the SSH server',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password/Private Key',
      description: 'The password/private key for the SSH server',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { method, host, port, username, password } = auth;
    const ssh = new NodeSSH();

    try {
      const sshConfig: Config = {
        host,
        port,
        username,
      };

      if (method === 'password') {
        sshConfig.password = password;
      } else if (method === 'private-key') {
        sshConfig.privateKey = password;
      }

      await ssh.connect(sshConfig);

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
      await ssh.dispose();
    }
  },
  required: true,
});

export const ssh = createPiece({
  displayName: "SSH",
  description: 'Secure Shell',
  auth: sshAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: "https://cdn.activepieces.com/pieces/ssh.png",
  categories: [PieceCategory.CORE, PieceCategory.DEVELOPER_TOOLS],
  authors: ['bnason'],
  actions,
  triggers: [],
});
