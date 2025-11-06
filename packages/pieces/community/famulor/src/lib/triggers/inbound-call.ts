import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

const inboundAssistantDropdown = () =>
  Property.Dropdown({
    displayName: 'Inbound Assistant',
    description: 'Select an inbound assistant to receive webhook notifications for',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please authenticate first',
          options: [],
        };
      }

      try {
        // Filter for inbound assistants only
        const assistants = await famulorCommon.listAllAssistants({ 
          auth: auth as string, 
          type: 'inbound',
          per_page: 100
        });
        
        if (!assistants.data || assistants.data.length === 0) {
          return {
            disabled: true,
            placeholder: 'No inbound assistants found. Create one first.',
            options: [],
          };
        }

        return {
          options: assistants.data.map((assistant: any) => ({
            label: `${assistant.name} (${assistant.status})`,
            value: assistant.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to fetch assistants',
          options: [],
        };
      }
    },
  });

export const inboundCall = createTrigger({
    auth: famulorAuth,
    name: 'inboundCall',
    displayName: 'Inbound Call Received',
    description: 'Triggers when an inbound call is received by your AI assistant. Webhook must be enabled for the selected assistant.',
    props: {
        assistant_id: inboundAssistantDropdown(),
    },
    sampleData: {
        assistant_id: 123,
        customer_phone: '+16380991171',
        assistant_phone: '+16380991171',
        call_id: "call_abc123",
        timestamp: "2024-01-15T10:30:00Z",
        status: "incoming",
        variables: {
            customer_name: "John Doe",
            caller_id: "+16380991171"
        }
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        await famulorCommon.enableInboundWebhook({
            auth: context.auth as string,
            assistant_id: context.propsValue.assistant_id as number,
            webhook_url: context.webhookUrl,
        });
    },
    async onDisable(context) {
        await famulorCommon.disableInboundWebhook({
            auth: context.auth as string,
            assistant_id: context.propsValue.assistant_id as number,
        });
    },
    async run(context) {
        return [context.payload.body];
    }
})
