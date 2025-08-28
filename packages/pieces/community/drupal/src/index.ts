import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { drupalCallToolAction } from './lib/actions/tools';
import { drupalCreateEntityAction } from './lib/actions/create_entity';
import { drupalListEntitiesAction } from './lib/actions/list_entities';
import { drupalGetEntityAction } from './lib/actions/get_entity';
import { drupalUpdateEntityAction } from './lib/actions/update_entity';
import { drupalDeleteEntityAction } from './lib/actions/delete_entity';
import { drupalPolling } from './lib/triggers/polling';
import { drupalWebhook } from './lib/triggers/webhook';

const markdownPropertyDescription = `
**Using Drupal's JSON:API**

Your Drupal site comes with JSON:API built-in. Just ensure it's enabled and configure user authentication:

1. Enable the JSON:API module
2. Create a user account and give it the permissions you want Activepieces to have
3. Use that account's credentials for authentication

Provide the website URL in the format https://www.example.com.
`;

export const drupalAuth = PieceAuth.CustomAuth({
  description: markdownPropertyDescription,
  required: true,
  props: {
    website_url: Property.ShortText({
      displayName: 'Website URL',
      required: true,
      description: 'URL of your Drupal site',
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: true,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { website_url, username, password } = auth;
    if (!website_url || !username || !password) {
      return {
        valid: false,
        error: 'Please fill all the fields [website_url, username, password]',
      };
    }
    try {
      const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: website_url + `/jsonapi`,
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Accept': 'application/vnd.api+json',
        },
      });
      console.debug('Auth validation response', response);
      if (response.status === 200) {
        return {
          valid: true,
        };
      }
      return {
        valid: false,
        error: 'Authentication failed. Please check your credentials.',
      };
    } catch (e: any) {
      return {
        valid: false,
        error: 'Connection failed: ' + e.message,
      };
    }
  },
});

export const drupal = createPiece({
  displayName: 'Drupal',
  auth: drupalAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://www.drupal.org/sites/all/themes/bluecheese/images/drupal-drop-062025.svg',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.BUSINESS_INTELLIGENCE,
    PieceCategory.COMMERCE,
    PieceCategory.CONTENT_AND_FILES,
    PieceCategory.DEVELOPER_TOOLS,
    PieceCategory.FLOW_CONTROL,
    PieceCategory.FORMS_AND_SURVEYS,
    PieceCategory.MARKETING,
  ],
  authors: ['jurgenhaas'],
  actions: [
    drupalCallToolAction, 
    drupalCreateEntityAction, 
    drupalListEntitiesAction, 
    drupalGetEntityAction,
    drupalUpdateEntityAction,
    drupalDeleteEntityAction
  ],
  triggers: [drupalPolling, drupalWebhook],
});
