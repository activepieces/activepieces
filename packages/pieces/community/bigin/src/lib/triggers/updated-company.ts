import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const updatedCompany = createTrigger({
  auth: biginAuth,
  name: 'updatedCompany',
  displayName: 'Updated Company',
  description: 'Fires when a company record is updated',
  props: {},
  sampleData: {
    server_time: 1696942911242,
    query_params: {},
    module: 'Companies',
    resource_uri: 'https://www.zohoapis.com/bigin/v2/Companies',
    ids: ['5436046000000930004'],
    affected_fields: ['Company_Name', 'Email', 'Phone'],
    operation: 'update',
    channel_id: '1001',
    token: 'TOKEN_FOR_VERIFICATION_OF_1001',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Generate a unique numeric channel ID
    const channelId = Date.now();

    const body = {
      watch: [
        {
          channel_id: channelId,
          events: ['Companies.edit'],
          channel_type: 'web',
          notify_url: context.webhookUrl,
          token: `TOKEN_FOR_VERIFICATION_OF_${channelId}`,
        },
      ],
    };

    console.log('Registering webhook:', JSON.stringify(body, null, 2));
    console.log('Webhook URL:', context.webhookUrl);

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/actions/watch',
      body
    );

    await context.store?.put('webhook_details', {
      channel_id: channelId,
      response: response,
    });

    return response;
  },

  async onDisable(context) {
    const webhookDetails = (await context.store?.get('webhook_details')) as {
      channel_id: number;
      response: any;
    };

    if (webhookDetails?.channel_id) {
      try {
        const endpoint = `/actions/watch?channel_ids=${webhookDetails.channel_id}`;

        await makeRequest(
          context.auth.access_token,
          HttpMethod.DELETE,
          endpoint
        );
      } catch (error) {
        console.error('Error disabling webhook:', error);
      }
    }
  },

  async run(context) {
    type CompanyUpdatePayload = {
      server_time?: number;
      query_params?: Record<string, any>;
      module?: string;
      resource_uri?: string;
      ids?: string[];
      affected_fields?: string[];
      operation?: string;
      channel_id?: string;
      token?: string;
      [key: string]: any;
    };

    let payload: CompanyUpdatePayload = context.payload
      ?.body as CompanyUpdatePayload;

    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload) as CompanyUpdatePayload;
      } catch (e) {
        console.log('Failed to parse payload as JSON:', e);
      }
    }

    if (payload?.module === 'Companies' && payload?.operation === 'update') {
      return [payload];
    }

    return [];
  },
});
