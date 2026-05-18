 import {
      PieceAuth,
      Property,
      createPiece,
    } from '@activepieces/pieces-framework';
    import { PieceCategory } from '@activepieces/shared';
    import { createUser } from './lib/actions/createUser';

    export const aminosAuth = PieceAuth.CustomAuth({
      description: 'Enter Aminos One authentication details',
      props: {
          base_url: Property.ShortText({
              displayName: 'Base URL',
              description: 'Enter the base URL',
              required: true,
          }),
          access_token: PieceAuth.SecretText({
              displayName: 'API key',
              description: 'Enter the API key from your Aminos One panel',
              required: true
          })
      },
      // Optional Validation
      validate: async ({auth}) => {
          if(auth){
              return {
                  valid: true,
              }
          }
          return {
              valid: false,
              error: 'Invalid Api Key'
          }
      },
      required: true
  });

    export const aminos = createPiece({
      displayName: "Aminos",
      auth: aminosAuth,
      categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
      minimumSupportedRelease: '0.30.0',
      logoUrl: "https://cdn.activepieces.com/pieces/aminos.png",
      authors: ["buttonsbond"],
      actions: [createUser],
      triggers: [],
    });
    
