import { createAction } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { makeClient, tarventCommon } from '../common';

export const generateCustomEvent = createAction({
  auth: tarventAuth,
  name: 'tarvent_generate_custom_event',
  displayName: 'Generate A Custom Event',
  description: 'Generate a custom event in your Tarvent account.',
  audience: 'both',
  aiMetadata: { description: 'Fires a predefined custom event in Tarvent for a specific contact, which can drive journeys and automations listening for that event. Use to signal that a contact performed a tracked action. Not idempotent: each call emits another event occurrence.', idempotent: false },
  props: {
    customEventId: tarventCommon.customEventId(true, ''),
    contactId: tarventCommon.contactId
  },
  async run(context) {
    const { customEventId, contactId } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.generateCustomEvent(contactId,customEventId);
  },
});
