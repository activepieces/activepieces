import { HttpMethod, createCustomApiCallAction, httpClient } from "@activepieces/pieces-common";
import { createPiece, PieceAuth, PiecePropValueSchema, Property } from "@activepieces/pieces-framework";
import FormData from 'form-data';

const formalooAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
  1. Go to https://beta.formaloo.com/profile#api-credentials
  2. Scroll down and you will find the API key and API Secret
  3. Copy and paste below the keys
  `,
  props: {
    api_key: Property.ShortText({
      displayName: 'API Key',
      description: 'Enter the base URL',
      required: true,
    }),
    api_secret: PieceAuth.SecretText({
      displayName: 'Access Token',
      description: 'Enter the access token',
      required: true
    })
  },
  validate: async ({ auth }) => {
    if (auth) {
      try {
        const token: string = await authenticate(auth)
        return !!token && token !== '' ? { valid: true } : { valid: false, error: "" }
      } catch (e: any) {
        return {
          valid: false,
          error: 'Credentials are invalid. ' + e?.message,
        };
      }
    }

    return {
      valid: false,
      error: 'Invalid Keys. Check and retry again.'
    }
  }
})

const authenticate = async (auth: PiecePropValueSchema<typeof formalooAuth>) => {
  const form = new FormData();
  form.append('grant_type', 'client_credentials');
  return (await httpClient.sendRequest<{ authorization_token: string }>({
    method: HttpMethod.POST,
    url: `https://api.formaloo.net/v2.0/oauth2/authorization-token/`,
    headers: {
      'Authorization': `Basic ${auth.api_secret}`,
      ...form.getHeaders(),
    },
    body: form,
  }))?.body?.authorization_token
}

const authenticateWait = (auth: PiecePropValueSchema<typeof formalooAuth>) => {
  let token: string | null = null;
  const done = (result: string | null) => {
    token = result;
  };

  authenticate(auth as PiecePropValueSchema<typeof formalooAuth>)
    .then((result) => done(result))
    .catch(() => done(null));

  while (!token) {
    new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return token
}

export const formaloo = createPiece({
  displayName: "Formaloo",
  auth: formalooAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://pbs.twimg.com/profile_images/1542832912340586504/VX1muYYD_400x400.jpg",//TODO: change logo
  authors: [],
  actions: [
    createCustomApiCallAction({
      auth: formalooAuth,
      baseUrl: () => {
        return 'https://api.formaloo.net/v2.0'
      },
      authMapping: (auth) => {
        const token = authenticateWait(auth as PiecePropValueSchema<typeof formalooAuth>)
        
        if (token) {
          return {
            'Authorization': `JWT ${token}`,
            'x-api-key': `${(auth as PiecePropValueSchema<typeof formalooAuth>).api_key}`
          }
        }

        return {}
      }
    })
  ],
  triggers: [],
});
