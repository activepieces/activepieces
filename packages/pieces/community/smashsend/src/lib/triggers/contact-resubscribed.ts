import { createTrigger } from '@activepieces/pieces-framework';
import { smashsendAuth } from '../..';
import { createWebhookTrigger, WEBHOOK_EVENTS } from '../common/webhook';

const baseTrigger = createWebhookTrigger(
  WEBHOOK_EVENTS.CONTACT_RESUBSCRIBED,
  'Contact Resubscribed',
  'Triggers when any contact resubscribes to receive emails'
);

export const contactResubscribedTrigger = createTrigger({
  auth: smashsendAuth,
  ...baseTrigger,
}); 