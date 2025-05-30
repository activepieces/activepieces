import { createTrigger } from '@activepieces/pieces-framework';
import { smashsendAuth } from '../..';
import { createWebhookTrigger, WEBHOOK_EVENTS } from '../common/webhook';

const baseTrigger = createWebhookTrigger(
  WEBHOOK_EVENTS.CONTACT_UNSUBSCRIBED,
  'Contact Unsubscribed',
  'Triggers when any contact unsubscribes from your emails'
);

export const contactUnsubscribedTrigger = createTrigger({
  auth: smashsendAuth,
  ...baseTrigger,
}); 