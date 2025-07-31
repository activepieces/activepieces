import { createAction } from '@activepieces/pieces-framework';
import { tarventAuth } from '../..';
import { makeClient, tarventCommon } from '../common';

export const generateCustomEvent = createAction({
  auth: tarventAuth,
  name: 'tarvent_generate_custom_event',
  displayName: 'Generate A Custom Event',
  description: 'Generate a custom event in your Tarvent account.',
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
