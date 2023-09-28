
import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { createNewUser } from "./lib/actions/create-new-user";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const brilliantDirectoriesAuth = PieceAuth.CustomAuth({
  description: 'Enter your Brilliant Directories website URL & API Key',
  required: true,
  props: {
    site_url: Property.ShortText({
      displayName: 'Site URL',
      description: 'Your brilliant directories site URL',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your brilliant directories API key',
      required: true,
    })
  },
//   validate: async ({auth}) => {
//     // Validate the Site URL & API key using the verfy token endpoint
//     const request = await httpClient.sendRequest<string[]>({
//       url: auth.site_url + '/api/v2/token/verify',
//       method: HttpMethod.GET
//     });

//     if (request.status === 200) {
//       return {
//         valid: true,
//       }
//     }

//     return {
//       valid: false,
//       error: request.body
//     }
// }
});

export const brilliantDirectories = createPiece({
  displayName: "Brilliant Directories",
  auth: brilliantDirectoriesAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/brilliant-directories.png",
  authors: ['Shay Punter @ PunterDigital', 'Tim M'],
  actions: [createNewUser],
  triggers: [],
});
