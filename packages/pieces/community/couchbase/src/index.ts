import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createCouchbaseClient, closeCluster, CouchbaseAuthValue } from './lib/common';
import actions from './lib/actions';

export const couchbaseAuth = PieceAuth.CustomAuth({
  description: 'Connect to your Couchbase cluster',
  required: true,
  props: {
    connectionString: Property.ShortText({
      displayName: 'Connection String',
      description: 'Couchbase connection string (e.g., couchbase://localhost or couchbases://cloud.couchbase.com)',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Username for authentication',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      description: 'Password for authentication',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const authValue = auth as CouchbaseAuthValue;

    if (!authValue.connectionString) {
      return { valid: false, error: 'Connection string is required' };
    }
    if (!authValue.username) {
      return { valid: false, error: 'Username is required' };
    }
    if (!authValue.password) {
      return { valid: false, error: 'Password is required' };
    }

    try {
      const cluster = await createCouchbaseClient(authValue);
      await cluster.ping();
      await closeCluster(cluster);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Connection failed: ${(error as Error).message}`,
      };
    }
  },
});

export const couchbasePiece = createPiece({
  displayName: 'Couchbase',
  description: 'NoSQL document database for modern applications',
  auth: couchbaseAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/couchbase.png',
  authors: ['chedim', 'onyedikachi-david'],
  actions,
  triggers: [],
});
