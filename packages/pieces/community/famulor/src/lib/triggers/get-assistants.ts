import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<any>, { type?: string; per_page?: number }> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue }) => {
    const perPage = propsValue['per_page'] || 10;
    const type = propsValue['type'];
    
    // Get all assistants with pagination
    let allAssistants: any[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const assistants = await famulorCommon.listAllAssistants({ 
        auth: auth as string, 
        per_page: perPage,
        page: currentPage,
        type
      });
      
      if (assistants.data && assistants.data.length > 0) {
        allAssistants = allAssistants.concat(assistants.data);
        hasMorePages = currentPage < assistants.last_page;
        currentPage++;
      } else {
        hasMorePages = false;
      }
    }

    return allAssistants.map((assistant) => {
      const assistantDate = assistant.updated_at
        ? dayjs(assistant.updated_at)
        : dayjs(assistant.created_at);
      return {
        epochMilliSeconds: assistantDate.valueOf(),
        data: assistant,
      };
    });
  },
};

export const getAssistants = createTrigger({
    auth: famulorAuth,
    name: 'getAssistants',
    displayName: 'New or Updated Assistant',
    description: 'Triggers when AI assistants are created or updated in your Famulor account.',
    props: {
        type: Property.StaticDropdown({
            displayName: 'Assistant Type',
            description: 'Filter assistants by type',
            required: false,
            options: {
                options: [
                    { label: 'All Types', value: '' },
                    { label: 'Inbound', value: 'inbound' },
                    { label: 'Outbound', value: 'outbound' },
                ],
            },
        }),
        per_page: Property.Number({
            displayName: 'Items Per Page',
            description: 'Number of assistants to fetch per page (1-100, default: 10)',
            required: false,
            defaultValue: 10,
        }),
    },
    sampleData: {
        id: 123,
        user_id: 456,
        name: "Customer Support Assistant",
        type: "inbound",
        status: "active",
        phone_number_id: 789,
        voice_id: 101,
        language_id: 1,
        language: "en-US",
        timezone: "UTC",
        initial_message: "Hello! How can I help you today?",
        system_prompt: "You are a helpful customer support assistant.",
        max_duration: 1800,
        record: true,
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T14:20:00Z",
        variable: {
            company_name: "ACME Corp",
            support_email: "support@acme.com"
        },
        is_webhook_active: true,
        webhook_url: "https://api.example.com/webhook"
    },
type: TriggerStrategy.POLLING,
async test(context) {
    return await pollingHelper.test(polling, context);
},
async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
},
async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
},
async run(context) {
    return await pollingHelper.poll(polling, context);
},
});
