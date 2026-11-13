import { createAction } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventOperations } from '../common/operations';
import { tarventOutputSchemas } from '../output-schemas';

export const generateCustomEvent = createAction({
  auth: tarventAuth,
  name: 'tarvent_generate_custom_event',
  classification: 'WRITE',
  displayName: 'Generate A Custom Event',
  description: 'Records a custom event for a contact in your Tarvent account.',
  audience: 'human',
  aiMetadata: {
    description:
      'Records a predefined Tarvent custom event (by its event key) for one contact (by contact ID); journeys and automations listening for that event can then run. Use Find Custom Event to get the key. Not idempotent: each call records another event occurrence.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.customEventGenerated,
  props: {
    customEventId: tarventCommon.customEventId(true, 'The custom event to record (its key is sent).'),
    contactId: tarventCommon.contactId,
  },
  async run(context) {
    return tarventOperations.recordCustomEvent({ auth: context.auth.props, contactId: context.propsValue.contactId, eventKey: context.propsValue.customEventId });
  },
});
