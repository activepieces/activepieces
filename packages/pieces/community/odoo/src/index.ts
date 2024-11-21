import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import Odoo from './commom/index';
import actions from './lib/actions';

export const odooAuth = PieceAuth.CustomAuth({
  props: {
    base_url: Property.ShortText({
      displayName: 'Odoo URL',
      description: 'Enter the base URL',
      required: true,
    }),
    database: Property.ShortText({
      displayName: 'Odoo Database',
      description: 'Enter the database name',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Odoo Username',
      description: 'Enter the username',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'Odoo API Key',
      description: 'Enter the API Key',
      required: true,
    }),
  },
  // Optional Validation
  validate: async ({ auth }) => {
    const { base_url, database, username, api_key } = auth;

    const odoo = new Odoo({
      url: base_url,
      port: 443,
      db: database,
      username: username,
      password: api_key,
    });

    try {
      await odoo.connect();

      return {
        valid: true,
      };
    } catch (err) {
      return {
        valid: false,
        error:
          'Connection failed. Please check your credentials and try again.',
      };
    }
  },
  required: true,
});

export const odoo = createPiece({
  displayName: 'Odoo',
  description: 'Open source all-in-one management software',
  auth: odooAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/odoo.png',
  authors: ["mariomeyer","kishanprmr","abuaboud"],
  actions,
  triggers: [],
});
