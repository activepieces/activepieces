
import { PieceAuth, Property, createPiece } from "@activepieces/pieces-framework";
import { createFile } from "./lib/actions/create-file";
import { newOrModifiedFile } from "./lib/triggers/new-modified-file";

export const sftpAuth = PieceAuth.CustomAuth({
  displayName: 'Authentication',
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
  required: true
})

export const sftp = createPiece({
  displayName: "SFTP",
  minimumSupportedRelease: '0.5.0',
  logoUrl: "https://cdn.activepieces.com/pieces/sftp.svg",
  authors: ["Abdallah-Alwarawreh"],
  auth: sftpAuth,
  actions: [createFile],
  triggers: [newOrModifiedFile],
});
