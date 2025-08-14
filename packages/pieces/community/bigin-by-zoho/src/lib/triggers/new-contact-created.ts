
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { ZOHO_WEBHOOK_TOKEN } from '../common/constants';
import { biginAuth } from '../../index';
import { biginApiService } from '../common/request';

const CACHE_KEY = 'bigin_created_contact_trigger';

export const newContactCreated = createTrigger({
  auth: biginAuth,
  name: 'newContactCreated',
  displayName: 'New Contact Created',
  description: 'Triggers when a new contact is created',
  props: {},
  sampleData: {
    server_time: 1754252081534,
    query_params: {},
    module: 'Contacts',
    resource_uri: 'https://www.zohoapis.com/bigin/v1/Contacts',
    ids: ['6913232000000583260'],
    affected_fields: [],
    operation: 'insert',
    channel_id: '1722705400',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    try {
      const channel_id = Date.now().toString();
      const { api_domain } = context.auth as any;

      const webhookData = {
        watch: [
          {
            channel_id,
            events: ['Contacts.create'],
            notify_url: context.webhookUrl,
            token: ZOHO_WEBHOOK_TOKEN,
          },
        ],
      };

      await biginApiService.createWebhook(context.auth.access_token, webhookData, api_domain)

      await context.store.put(CACHE_KEY, channel_id);
    } catch (error) {
      console.error('Failed to enable Zoho webhook');
    }
  },
  async onDisable(context) {
    const channel_id = await context.store.get(CACHE_KEY) as string;
    if (!channel_id) return;

    const { api_domain } = context.auth as any;

    await biginApiService.deleteWebhook(
      context.auth.access_token,
      api_domain,
      channel_id
    );

    await context.store.delete(CACHE_KEY);
  },
  async run(context) {
    const { token } = context.payload.body as any;

    if (token !== ZOHO_WEBHOOK_TOKEN) {
      throw new Error('Invalid webhook token');
    }

    return [context.payload.body];
  },
});