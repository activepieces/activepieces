import { createTrigger } from '@activepieces/pieces-framework';
import { smashsendAuth } from '../..';
import { createWebhookTrigger, WEBHOOK_EVENTS } from '../common/webhook';

const baseTrigger = createWebhookTrigger(
  WEBHOOK_EVENTS.CONTACT_CREATED,
  'Contact Created',
  'Triggers when a new contact is created in your SmashSend workspace'
);

export const contactCreatedTrigger = createTrigger({
  auth: smashsendAuth,
  ...baseTrigger,
}); 