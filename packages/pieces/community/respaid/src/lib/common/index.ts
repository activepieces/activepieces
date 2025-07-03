import { TriggerHookContext, TriggerStrategy, SecretTextProperty } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

interface ActionPayloadProps {
  unique_identifier?: string;
  invoice_number?: string;
  email?: string;
  amount?: string;
}

export const respaidCommon = {
  baseUrl: 'https://backend.widr.app/api/workflow',
  getHeadersStructure: (auth: string) => ({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-API-KEY': auth
  }),
};

export const respaidActionsCommon = {
  getPayloadBodyStructure: (propsValue: ActionPayloadProps) => ({
    type: 'active_pieces',
    payload: JSON.stringify({
      ...(propsValue.unique_identifier && { unique_identifier: propsValue.unique_identifier }),
      ...(propsValue.invoice_number && { invoice_number: propsValue.invoice_number }),
      ...(propsValue.amount && { amount: propsValue.amount }),
      ...(propsValue.email && { email: propsValue.email }),
    })
  }),
  validateProps: (propsValue: ActionPayloadProps) => {
    const { unique_identifier, email } = propsValue;
    if (!unique_identifier && !email) {
      throw new Error('You must provide either a unique_identifier OR email.');
    }
  }
}


export const respaidTriggersCommon = {
  onEnable: (eventType: string) => async(context: TriggerHookContext<SecretTextProperty<true>, Record<string, never>, TriggerStrategy.WEBHOOK>) => {
    try {
      console.log('Trigger enabled, subscribing to webhook');
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${respaidCommon.baseUrl}/webhook/subscribe`,
        headers: respaidCommon.getHeadersStructure(context.auth),
        body: {
          type: 'active_pieces',
          event_type: eventType,
          target_url: context.webhookUrl,
        },
      });
    } catch (error) {
      console.error('Error subscribing to webhook:', error);
      throw new Error('Failed to subscribe to webhook');
    }
  },
  onDisable: (eventType: string) => async(context: TriggerHookContext<SecretTextProperty<true>, Record<string, never>, TriggerStrategy.WEBHOOK>) => {
    try {
      console.log('Trigger disabled, unsubscribing from webhook');
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${respaidCommon.baseUrl}/webhook/unsubscribe`,
        headers: respaidCommon.getHeadersStructure(context.auth),
        body: {
          type: 'active_pieces',
          event_type: eventType,
          target_url: context.webhookUrl,
        },
      });
    } catch (error) {
      console.error('Error unsubscribing from webhook:', error);
      throw new Error('Failed to unsubscribe to webhook');
    }
  },
  getPayload: (context: TriggerHookContext<SecretTextProperty<true>, Record<string, never>, TriggerStrategy.WEBHOOK>) => {
    return typeof context.payload.body === 'string' 
    ? JSON.parse(context.payload.body) 
    : context.payload;
  }
}
