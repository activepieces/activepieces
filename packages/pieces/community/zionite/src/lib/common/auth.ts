import {
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import {HttpMethod, httpClient} from '@activepieces/pieces-common';
export const zioniteAuth = PieceAuth.CustomAuth({
    displayName: 'Self-hosted Connection',
    props: {
        baseUrl: Property.ShortText({
            displayName: 'Instance URL',
            defaultValue: 'https://zioteams.zionit.in',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email ID',
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
          url: `${auth.baseUrl}/user/login`,
          body: {
            emailId: auth.email,
            password: auth.password,
          },
        });
    
      //   console.log(
      //   'Zioteam login successful:',
      //   Boolean(response.body?.data?.accessToken),
      // );

      return {
        // valid: Boolean(response.body?.data?.accessToken),
        valid: true,
      };
      } catch (error) {
        console.error('Zioteam login failed:', error);

      return {
         valid: false,
         error: 'Invalid Zioteam credentials',
       };
      }
    },
    // Optional: cache the token server-side to avoid a login call per action
    refresh: {
        generate: async ({ auth }) => {
            const response = await httpClient.sendRequest<{data: {accessToken: string;};}>({
                method: HttpMethod.POST,
                url: `${auth.baseUrl}/user/login`,
                body: { emailId: auth.email, password: auth.password },
            });

            // const accessToken =
            //   response.body?.data?.accessToken;
      
            // if (!accessToken) {
            //   throw new Error(
            //     'Zioteam login succeeded but access token was not returned',
            //   );
            // }

            return {
                 access_token: response.body.data.accessToken,
                // expires_in: 3600, // optional, in seconds
            };
        },
        // Used when the API doesn't return expires_in. Defaults to 3300 (55 min).
        defaultExpiresIn: 3300,
    },
    required: true,
})
