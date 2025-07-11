import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { checkoutComAuth, getEnvironmentFromApiKey } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const paymentEventsTrigger = createTrigger({
  name: 'payment_events',
  displayName: 'Payment Events',
  description: 'Trigger order fulfillment when payment is approved.',
  auth: checkoutComAuth,
  props: {
    eventTypes: Property.MultiSelectDropdown({
      displayName: 'Event Types',
      description: 'Select the payment events you want to listen for',
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
          
          const gatewaySource = eventSources.find((source: any) => source.id === 'gateway');
          
          if (!gatewaySource || !gatewaySource.events) {
            return {
              disabled: false,
              options: [
                { label: 'Payment Approved', value: 'payment_approved' },
                { label: 'Payment Declined', value: 'payment_declined' },
                { label: 'Payment Captured', value: 'payment_captured' },
                { label: 'Payment Refunded', value: 'payment_refunded' },
                { label: 'Payment Voided', value: 'payment_voided' },
                { label: 'Card Verified', value: 'card_verified' },
                { label: 'Card Verification Declined', value: 'card_verification_declined' },
                { label: 'Payment Authorization Incremented', value: 'payment_authorization_incremented' },
                { label: 'Payment Authorization Increment Declined', value: 'payment_authorization_increment_declined' },
                { label: 'Payment Capture Declined', value: 'payment_capture_declined' },
                { label: 'Payment Refund Declined', value: 'payment_refund_declined' },
                { label: 'Payment Void Declined', value: 'payment_void_declined' },
              ],
            };
          }

          return {
            disabled: false,
            options: gatewaySource.events.map((event: any) => ({
              label: event.display_name || event.id,
              value: event.id,
            })),
          };
        } catch (error) {
          return {
            disabled: false,
            options: [
              { label: 'Payment Approved', value: 'payment_approved' },
              { label: 'Payment Declined', value: 'payment_declined' },
              { label: 'Payment Captured', value: 'payment_captured' },
              { label: 'Payment Refunded', value: 'payment_refunded' },
              { label: 'Payment Voided', value: 'payment_voided' },
              { label: 'Card Verified', value: 'card_verified' },
              { label: 'Card Verification Declined', value: 'card_verification_declined' },
            ],
          };
        }
      },
    }),
  },
  sampleData: {
    id: 'evt_az5sblvku4ge3dwpztvyizgcau',
    source: 'gateway',
    type: 'payment_approved',
    timestamp: '2019-08-24T14:15:22Z',
    version: '1.0.0',
    data: {
      id: 'pay_mbabizu24mvu3mela5njyhpit4',
      action_id: 'act_y3oqhf46pyzuxjbcn2giaqnb44',
      amount: 6540,
      currency: 'USD',
      approved: true,
      status: 'Authorized',
      auth_code: '643381',
      payment_type: 'Regular',
      response_code: '10000',
      response_summary: 'Approved',
      reference: 'ORD-5023-4E89',
      processed_on: '2020-02-27T11:26:59Z'
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
          name: 'Activepieces Payment Events Workflow',
          active: true,
          conditions: [
            {
              type: 'event',
              events: {
                gateway: eventTypes,
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

      await context.store.put('checkout_payment_workflow', {
        workflowId: response.body.id,
      });
    } catch (error: any) {
      throw new Error(`Failed to create payment events workflow: ${error.message}`);
    }
  },
  async onDisable(context) {
    try {
      const workflowData = await context.store.get<{ workflowId: string }>('checkout_payment_workflow');
      
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
      console.error('Failed to delete payment events workflow:', error.message);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
}); 