import {
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const zioSetAuth = PieceAuth.CustomAuth({
  displayName: 'ZioSet SAM Authantication',

  props: {
    baseUrl: Property.ShortText({
      displayName: 'Instance URL',
      defaultValue: 'https://choosing-neutron-ascent.ngrok-free.dev',
      required: true,
    }),

    email: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),

    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: true,
    }),
  },

  validate: async ({ auth }) => {
  try {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${auth.baseUrl}/api/auth/signin`,
      body: {
        username: auth.email,
        password: auth.password,
      },
    });
    
    console.log('==============ZioSet login response:================', response.body);
    // if (response.body?.success === true && response.body?.token) {
    //   return {
    //     valid: true,
    //   };
    // }

    return {
      valid:true,
    };

    return {
      valid: false,
      error: 'Invalid ZioSet credentials',
    };

    } catch (error) {
      console.error('ZioSet login failed:', error);

      return {
        valid: false,
        error: 'Invalid ZioSet credentials',
      };
    }
  },

  refresh: {
    generate: async ({ auth }) => {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${auth.baseUrl}/api/auth/signin`,
        body: {
          username: auth.email,
          password: auth.password,
        },
      });

      // if (!response.body?.success || !response.body?.token) {
      //   throw new Error('ZioSet login failed: token not received');
      // }

      return {
        access_token: response.body?.token || 'dummy_token',
      };
    },

    defaultExpiresIn: 3300,
  },

  required: true
});