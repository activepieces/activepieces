import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { biginZohoAuth } from '../../index';
import { makeRequest } from '../common';

export const newTask = createTrigger({
  auth: biginZohoAuth,
  name: 'newTask',
  displayName: 'New Task',
  description: 'Fires when a task is created',
  props: {},
  sampleData: {
    server_time: 1696942911242,
    query_params: {},
    module: 'Tasks',
    resource_uri: 'https://www.zohoapis.com/bigin/v2/Tasks',
    ids: ['5436046000000930004'],
    affected_fields: [],
    operation: 'insert',
    channel_id: '1001',
    token: 'TOKEN_FOR_VERIFICATION_OF_1001',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const channelId = Date.now();

    const body = {
      watch: [
        {
          channel_id: channelId,
          events: ['Tasks.create'],
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
        await makeRequest(
          context.auth.access_token,
          HttpMethod.DELETE,
          `/actions/watch?channel_ids=${webhookDetails.channel_id}`,
          context.auth.props?.['location'] || 'com'
        );
      } catch (error) {
        console.error('Error disabling webhook:', error);
      }
    }
  },

  async run(context) {
    type TaskPayload = {
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

    let payload: TaskPayload = context.payload?.body as TaskPayload;

    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload) as TaskPayload;
      } catch (e) {
        console.log('Failed to parse payload as JSON:', e);
      }
    }

    if (payload?.module === 'Tasks' && payload?.operation === 'insert') {
      return [payload];
    }

    return [];
  },
}); 