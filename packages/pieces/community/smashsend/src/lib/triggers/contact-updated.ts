import { createTrigger } from '@activepieces/pieces-framework';
import { smashsendAuth } from '../..';
import { createWebhookTrigger, WEBHOOK_EVENTS } from '../common/webhook';

const baseTrigger = createWebhookTrigger(
  WEBHOOK_EVENTS.CONTACT_UPDATED,
  'Contact Updated',
  'Triggers when any contact details are updated'
);

export const contactUpdatedTrigger = createTrigger({
  auth: smashsendAuth,
  ...baseTrigger,
}); 