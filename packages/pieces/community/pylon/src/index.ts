import { createCustomApiCallAction } from '@activepieces/pieces-common'
import { PieceAuth, createPiece } from '@activepieces/pieces-framework'

const auth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
})
export const pylon = createPiece({
  displayName: 'Pylon',
  auth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pylon.png',
  authors: [],
  actions: [
    createCustomApiCallAction({
      auth: auth,
      baseUrl: () => 'https://api.usepylon.com',
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        }
      },
    }),
  ],
  triggers: [],
})
