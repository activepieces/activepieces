import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const newCall = createTrigger({
  auth: biginAuth,
  name: 'newCall',
  displayName: 'New Call',
  description: 'Fires when a call is created',
  props: {},
  sampleData: {
    server_time: 1696942911242,
    query_params: {},
    module: 'Calls',
    resource_uri: 'https://www.zohoapis.com/bigin/v2/Calls',
    ids: ['5436046000000930004'],
    affected_fields: [],
    operation: 'insert',
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
          events: ['Calls.create'],
          channel_type: 'web',
          notify_url: context.webhookUrl,
          token: `TOKEN_FOR_VERIFICATION_OF_${channelId}`,
        },
      ],
    };

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/actions/watch',
     context.auth.props?.['location'] || 'com',
      body
    );

    // Store the watch details for cleanup
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
          endpoint,
          context.auth.props?.['location'] || 'com',
        );
      } catch (error) {
        console.error('Error disabling webhook:', error);
      }
    }
  },

  async run(context) {
    type CallPayload = {
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

    // The payload might be at different levels
    let payload: CallPayload = context.payload?.body as CallPayload;

    // If body is a string, try to parse it
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload) as CallPayload;
      } catch (e) {
        console.log('Failed to parse payload as JSON:', e);
      }
    }
    if (payload?.module === 'Calls' && payload?.operation === 'insert') {
      return [payload];
    }

    return [];
  },
});
