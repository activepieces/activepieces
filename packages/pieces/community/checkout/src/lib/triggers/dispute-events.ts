import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { checkoutComAuth, getEnvironmentFromApiKey } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const disputeEventsTrigger = createTrigger({
  name: 'dispute_events',
  displayName: 'Dispute Events',
  description: 'Notify operations upon dispute opening or resolution.',
  auth: checkoutComAuth,
  props: {
    eventTypes: Property.MultiSelectDropdown({
      displayName: 'Event Types',
      description: 'Select the dispute events you want to listen for',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your Checkout.com account first',
          };
        }

        try {
          const { baseUrl } = getEnvironmentFromApiKey(auth as string);
          
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${baseUrl}/workflows/event-types`,
            headers: {
              Authorization: `Bearer ${auth}`,
              'Content-Type': 'application/json',
            },
          });

          const eventSources = response.body || [];
          
          const disputeSource = eventSources.find((source: any) => source.id === 'dispute' || source.id === 'disputes');
          
          if (!disputeSource || !disputeSource.events) {
            return {
              disabled: false,
              options: [
                { label: 'Dispute Canceled', value: 'dispute_canceled' },
                { label: 'Dispute Evidence Required', value: 'dispute_evidence_required' },
                { label: 'Dispute Expired', value: 'dispute_expired' },
                { label: 'Dispute Lost', value: 'dispute_lost' },
                { label: 'Dispute Resolved', value: 'dispute_resolved' },
                { label: 'Dispute Won', value: 'dispute_won' },
              ],
            };
          }

          return {
            disabled: false,
            options: disputeSource.events.map((event: any) => ({
              label: event.display_name || event.id,
              value: event.id,
            })),
          };
        } catch (error) {
          return {
            disabled: false,
            options: [
              { label: 'Dispute Canceled', value: 'dispute_canceled' },
              { label: 'Dispute Evidence Required', value: 'dispute_evidence_required' },
              { label: 'Dispute Expired', value: 'dispute_expired' },
              { label: 'Dispute Lost', value: 'dispute_lost' },
              { label: 'Dispute Resolved', value: 'dispute_resolved' },
              { label: 'Dispute Won', value: 'dispute_won' },
            ],
          };
        }
      },
    }),
  },
  sampleData: {
    id: 'evt_lw4cjxhp4jme3dwpztvyizgcau',
    source: 'dispute',
    type: 'dispute_evidence_required',
    timestamp: '2019-08-24T14:15:22Z',
    version: '1.0.0',
    data: {
      id: 'dsp_rbhwd2qrg13uhr4w2oxna5tav6',
      category: 'fraudulent',
      amount: 6540,
      currency: 'USD',
      reason_code: '4855',
      status: 'evidence_required',
      resolved_reason: 'dispute_not_valid',
      payment_id: 'pay_mbabizu24mvu3mela5njyhpit4',
      payment_reference: 'ORD-5023-4E89',
      payment_arn: '74593210001234567890123',
      payment_method: 'VISA',
      received_on: '2019-08-24T14:15:22Z',
      last_update: '2019-08-24T14:15:22Z'
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { eventTypes } = context.propsValue;
    const { baseUrl } = getEnvironmentFromApiKey(context.auth);
    
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${baseUrl}/workflows`,
        headers: {
          Authorization: `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
        body: {
          name: 'Activepieces Dispute Events Workflow',
          active: true,
          conditions: [
            {
              type: 'event',
              events: {
                dispute: eventTypes,
              },
            },
          ],
          actions: [
            {
              type: 'webhook',
              url: context.webhookUrl,
            },
          ],
        },
      });

      await context.store.put('checkout_dispute_workflow', {
        workflowId: response.body.id,
      });
    } catch (error: any) {
      throw new Error(`Failed to create dispute events workflow: ${error.message}`);
    }
  },
  async onDisable(context) {
    try {
      const workflowData = await context.store.get<{ workflowId: string }>('checkout_dispute_workflow');
      
      if (workflowData?.workflowId) {
        const { baseUrl } = getEnvironmentFromApiKey(context.auth);
        
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `${baseUrl}/workflows/${workflowData.workflowId}`,
          headers: {
            Authorization: `Bearer ${context.auth}`,
          },
        });
      }
    } catch (error: any) {
      console.error('Failed to delete dispute events workflow:', error.message);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
}); 