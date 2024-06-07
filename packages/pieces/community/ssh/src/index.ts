import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { runCommands } from "./lib/actions/run-commands";
import { PieceCategory } from "@activepieces/shared";
import { connectToSSH, disposeSSH } from "./lib/common/common";

const authGuide = `
You can authenticate with an SSH server using a username and password or a private key.
`;

export const sshAuth = PieceAuth.CustomAuth({
  required: true,
  description: authGuide,
  props: {
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The username to use for the SSH connection',
      required: true,
    }),
    passcodeType: Property.StaticDropdown<'password' | 'private-key'>({
      displayName: 'Passcode Type',
      description: 'The type of passcode to use for the SSH connection',
      required: true,
      options: {
        options: [
          {
            label: 'Password',
            value: 'password',
          },
          {
            label: 'Private Key',
            value: 'private-key',
          }
        ]
      }
    }),
    passcode: PieceAuth.SecretText({
      displayName: 'Password or Private Key',
      description: 'The password or private key to use for the SSH connection',
      required: true,
    }),
    host: Property.ShortText({
      displayName: 'Host',
      description: 'The host to connect to',
      required: true,
    }),
    port: Property.Number({
      displayName: 'Port',
      description: 'The port to use for the SSH connection',
      required: true,
      defaultValue: 22,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const ssh = await connectToSSH(auth)
      // await disposeSSH(ssh)
      return {
        valid: true,
      }
    }
    catch (e) {
      return {
        valid: false,
        error: JSON.stringify(e)
      }
    }
  },
});


export const ssh = createPiece({
  displayName: "SSH",
  auth: sshAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: "https://cdn.activepieces.com/pieces/ssh.svg",
  authors: ['AbdullahBitar'],
  actions: [runCommands],
  triggers: [],
  categories: [PieceCategory.CORE, PieceCategory.DEVELOPER_TOOLS],
});
