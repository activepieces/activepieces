import { createTrigger } from '@activepieces/pieces-framework';
import { smashsendAuth } from '../..';
import { createWebhookTrigger, WEBHOOK_EVENTS } from '../common/webhook';

const baseTrigger = createWebhookTrigger(
  WEBHOOK_EVENTS.CONTACT_DELETED,
  'Contact Deleted',
  'Triggers when a contact is deleted from your SmashSend workspace'
);

export const contactDeletedTrigger = createTrigger({
  auth: smashsendAuth,
  ...baseTrigger,
}); 