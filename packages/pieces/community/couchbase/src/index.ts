
    import {
      createPiece,
      PieceAuth,
      PiecePropValueSchema,
      Property,
    } from '@activepieces/pieces-framework';
    import { httpClient, propsValidation } from '@activepieces/pieces-common';
    import { z } from 'zod';
    import actions from './lib/actions';
    import { apiGet } from './lib/common';

    export const couchbaseAuth = PieceAuth.CustomAuth({
      validate: async ({auth}) => {
        try {
          await validateAuth(auth);
          return {valid: true};
        } catch (error) {
          return {valid: false, error: (error as Error)?.message};
        }
      },
      props: {
        queryApi: Property.ShortText({
          displayName: 'Couchbase Query API URL',
          required: false,
          description: 'URL for couchbase Query API endpoint: http{s?}://{host}:{port}/query/service'
        }),
        username: Property.ShortText({
          displayName: 'Username',
          required: true,
          description: 'The username for the Couchbase cluster'
        }),
        password: Property.ShortText({
          displayName: 'Password',
          required: true,
          description: 'The password for the Couchbase cluster'
        }),
        bucket: Property.ShortText({
          displayName: 'Bucket name',
          required: true,
          description: 'Name of the bucket to use on the Couchbase cluster'
        }),
        scope:Property.ShortText({
          displayName: 'Scope name',
          required: false,
          description: 'Name of the scope to use on the Couchbase cluster. Leave blank for default scope.'
        }),
      },
      required: true,
    });

    const validateAuth = async (auth: PiecePropValueSchema<typeof couchbaseAuth>) => {
      console.log("Validating couchbase auth...");
      await propsValidation.validateZod(auth, {
        username: z.string().min(1),
        password: z.string().min(1),
        bucket: z.string().min(1),
        scope: z.string().min(1),
      });

      if (!(auth.queryApi)) {
        return {valid: false, error: "A URL for Query or Search API is required."};
      }

      try {
        const request = apiGet(auth, "SELECT 1");
        const response = await httpClient.sendRequest(request);
        if (response.status !== 200) {
          console.error(response);
          return {valid: false, error: "Response " + response.status + ": " + response.body};
        }
      } catch (e) {
        console.error(e);
        return {valid: false, error: (e as Error)?.message};
      }
      console.log("Couchbase settings validated successfully.");

      return {valid: true};
    }

    export const couchbasePiece = createPiece({
      displayName: "Couchbase",
      auth: couchbaseAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/couchbase.png",
      authors: ['chedim'],
      actions,
      triggers: [],
    });
