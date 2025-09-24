import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

const assistantDropdownForWebhook = () =>
  Property.Dropdown({
    displayName: 'Assistant',
    description: 'Select an assistant to receive post-call webhook notifications for',
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
        // Get all assistants (both inbound and outbound can make calls)
        const assistants = await famulorCommon.listAllAssistants({ 
          auth: auth as string, 
          per_page: 100
        });
        
        if (!assistants.data || assistants.data.length === 0) {
          return {
            disabled: true,
            placeholder: 'No assistants found. Create one first.',
            options: [],
          };
        }

        return {
          options: assistants.data.map((assistant: any) => ({
            label: `${assistant.name} (${assistant.type} - ${assistant.status})`,
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

export const phoneCallEnded = createTrigger({
    auth: famulorAuth,
    name: 'phoneCallEnded',
    displayName: 'Phone Call Completed',
    description: 'Triggers when a phone call is completed, providing full call transcript, extracted variables, and call metadata.',
    props: {
        assistant_id: assistantDropdownForWebhook(),
    },
    sampleData: {
        id: 480336,
        customer_phone: "+4915123456789",
        assistant_phone: "+4912345678",
        duration: 180,
        status: "completed",
        extracted_variables: {
            customer_interested: true,
            appointment_scheduled: false,
            contact_reason: "product_inquiry",
            follow_up_needed: true,
            customer_budget: "10000-50000",
            decision_maker: true,
            next_contact_date: "2024-02-15"
        },
        input_variables: {
            customer_name: "Max Mustermann",
            company: "Beispiel GmbH"
        },
        transcript: "Assistent: Guten Tag, Herr Mustermann! Ich bin...",
        recording_url: "https://recordings.famulor.de/call-480336.mp3",
        created_at: "2024-01-15T10:30:00Z",
        finished_at: "2024-01-15T10:33:00Z",
        lead: {
            id: 12345,
            phone_number: "+4915123456789",
            variables: {
                customer_name: "Max Mustermann",
                company: "Beispiel GmbH",
                source: "website"
            },
            status: "contacted",
            created_at: "2024-01-14T09:00:00Z",
            updated_at: "2024-01-15T10:33:00Z"
        },
        campaign: {
            id: 123,
            name: "Q1 Sales Campaign"
        }
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        await famulorCommon.enablePostCallWebhook({
            auth: context.auth as string,
            assistant_id: context.propsValue.assistant_id as number,
            webhook_url: context.webhookUrl,
        });
    },
    async onDisable(context) {
        await famulorCommon.disablePostCallWebhook({
            auth: context.auth as string,
            assistant_id: context.propsValue.assistant_id as number,
        });
    },
    async run(context) {
        return [context.payload.body];
    }
})