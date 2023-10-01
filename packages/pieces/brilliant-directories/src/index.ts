
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { createNewUser } from "./lib/actions/create-new-user";

export const brilliantDirectoriesAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
  Enter your Brilliant Directories website URL & API Key
  `,
  props: {
    token: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The api key of the brilliant directories account account',
      required: true,
    }),
    apiTableUrl: Property.ShortText({
      displayName: 'Instance Url',
      description: 'The url of the brillant directories instance.',
      required: true,
      defaultValue: 'https://brilliant-directories.com/api',
    }),
  }
})

export const brilliantDirectories = createPiece({
  displayName: "Brilliant Directories",
  auth: brilliantDirectoriesAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/brilliant-directories.png",
  authors: ['Shay Punter @ PunterDigital', 'Tim M'],
  actions: [createNewUser],
  triggers: [],
});
