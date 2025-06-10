import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

export const webhooksApiAction = createAction({
  auth: dimoAuth,
  name: 'webhooks_api',
  displayName: 'Webhooks API',
  description: 'Manage webhooks for DIMO triggers (requires Developer JWT)',
  props: {
    operation: Property.StaticDropdown({
      displayName: 'Operation',
      description: 'Webhook operation to perform',
      required: true,
      defaultValue: 'list',
      options: {
        options: [
          { label: 'List Webhooks', value: 'list' },
          { label: 'Create Webhook', value: 'create' },
          { label: 'Delete Webhook', value: 'delete' },
        ],
      },
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'URL to receive webhook notifications',
      required: false,
    }),
    vehicleTokenId: Property.Number({
      displayName: 'Vehicle Token ID',
      description: 'Vehicle token ID for webhook (if applicable)',
      required: false,
    }),
    webhookId: Property.ShortText({
      displayName: 'Webhook ID',
      description: 'Webhook ID for delete operation',
      required: false,
    }),
  },
  async run(context) {
    const { operation, webhookUrl, vehicleTokenId, webhookId } = context.propsValue;
    
    if (!context.auth.developerJwt) {
      throw new Error('Developer JWT is required for Webhooks API. Please provide a Developer JWT in the authentication configuration.');
    }

    try {
      const baseUrl = context.auth.baseUrl || 'https://api.dimo.zone';
      let endpoint = '';
      let method: HttpMethod = HttpMethod.GET;
      let body = undefined;

      switch (operation) {
        case 'list':
          endpoint = '/v1/webhooks';
          method = HttpMethod.GET;
          break;
        case 'create':
          if (!webhookUrl) {
            throw new Error('Webhook URL is required for create operation');
          }
          endpoint = '/v1/webhooks';
          method = HttpMethod.POST;
          body = {
            url: webhookUrl,
            vehicleTokenId: vehicleTokenId || undefined,
          };
          break;
        case 'delete':
          if (!webhookId) {
            throw new Error('Webhook ID is required for delete operation');
          }
          endpoint = `/v1/webhooks/${webhookId}`;
          method = HttpMethod.DELETE;
          break;
        default:
          throw new Error('Invalid operation');
      }

      const response = await httpClient.sendRequest({
        method,
        url: `${baseUrl}${endpoint}`,
        body,
        headers: {
          'Authorization': `Bearer ${context.auth.developerJwt}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        operation,
        success: true,
        data: response.body,
      };
    } catch (error: any) {
      throw new Error(`Webhooks API request failed: ${error.message}`);
    }
  },
}); 