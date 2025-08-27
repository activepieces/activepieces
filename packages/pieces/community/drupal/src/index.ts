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
import { drupalPolling } from './lib/triggers/polling';
import { drupalWebhook } from './lib/triggers/webhook';

const markdownPropertyDescription = `
First, install the [Drupal Modeler API](https://www.drupal.org/project/modeler_api) module.

Then, after you've enabled the **modeler_api_connect** module, you get your API key from your user profile in Drupal.

Provide the website URL in the format https://www.example.com.
`;

export const drupalAuth = PieceAuth.CustomAuth({
  description: markdownPropertyDescription,
  required: true,
  props: {
    website_url: Property.ShortText({
      displayName: 'Website URL',
      required: true,
      description:
        'URL of the Drupal website, e.g. https://www.example.com',
    }),
    api_key: Property.ShortText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { website_url, api_key } = auth;
    if (!website_url || !api_key) {
      return {
        valid: false,
        error: 'Please fill all the fields [website_url, api_key]',
      };
    }
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: website_url + `/modeler_api`,
        headers: {
          'x-api-key': api_key,
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
        error: 'Validation failed with response code ' + response.status,
      };
    } catch (e: any) {
      return {
        valid: false,
        error: 'Validation failed: ' + e.message,
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
    drupalGetEntityAction
  ],
  triggers: [drupalPolling, drupalWebhook],
});
