import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { salesforceAuth } from '../..';

export const newOutboundMessage = createTrigger({
  auth: salesforceAuth,
  name: 'new_outbound_message',
  displayName: 'New Outbound Message',
  description: 'Triggers when a new outbound message is received from Salesforce',
  props: {},
  sampleData: {
    notifications: {
      organizationId: '00D000000000000EAA',
      actionId: '04k000000000001AAA',
      sessionId: 'session123',
      enterpriseUrl: 'https://na1.salesforce.com/services/Soap/c/56.0/00D000000000000',
      partnerUrl: 'https://na1.salesforce.com/services/Soap/u/56.0/00D000000000000',
      notification: [
        {
          id: 'notification1',
          sObject: {
            type: 'Account',
            id: '001000000000001AAA',
            name: 'Sample Account',
          },
        },
      ],
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // Webhook URL will be provided by Activepieces
    // Users need to configure the outbound message in Salesforce to point to this URL
  },
  async onDisable() {
    // No cleanup needed for outbound messages
  },
  async run(context) {
    // Parse the SOAP envelope from Salesforce outbound message
    const body = context.payload.body;
    
    return [body];
  },
});

