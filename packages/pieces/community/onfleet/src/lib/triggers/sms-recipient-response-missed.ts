import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { common, OnfleetWebhookTriggers } from '../common';
import { onfleetAuth } from '../..';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
export const smsRecipientResponseMissed = createTrigger({
  auth: onfleetAuth,
  name: 'sms_recipient_response_missed',
  displayName: 'SMS Recipient Response Missed',
  description:
    'Triggers when a recipient responds to a notification via SMS, but the organization is unable to handle it at that time',
  aiMetadata: {
    description:
      'Fires when a recipient replies by SMS to an Onfleet delivery notification but the organization cannot handle the response automatically at that moment. Represents an unhandled inbound recipient SMS, useful for routing the message to a human agent or support workflow. The payload includes the recipient and the message content.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {},
  //Create the webhook and save the webhook ID in store for disable behavior
  async onEnable(context) {
    const webhookId = await common.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      OnfleetWebhookTriggers.SMS_RECIPIENT_MISSED
    );

    await context.store?.put('_sms_recipient_response_missed_trigger', {
      webhookId: webhookId,
    });
  },
  //Delete the webhook
  async onDisable(context) {
    const response: any = await context.store?.get(
      '_sms_recipient_response_missed_trigger'
    );

    if (response !== null && response !== undefined) {
      await common.unsubscribeWebhook(context.auth, response.webhookId);
    }
  },
  //Return task
  async run(context) {
    return [context.payload.body];
  },

  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
    paramName: 'check',
  },

  async onHandshake(context) {
    return {
      status: 200,
      body: context.payload.queryParams['check'],
    };
  },

  sampleData: {},
});
