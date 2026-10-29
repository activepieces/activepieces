import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../auth';
import { tarventOperations } from '../../common/operations';
import { tarventOutputSchemas } from '../../output-schemas';

export const recordCustomEventAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_record_custom_event_ai',
  classification: 'WRITE',
  displayName: 'Record Custom Event (AI)',
  description: 'Records a custom event for a contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Records a predefined Tarvent custom event for one contact; journeys listening for it can then run. Give the contact ID and the event key (the key field from Find Custom Event, not its ID). Not idempotent: each call records another occurrence.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.customEventGenerated,
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'The Tarvent contact ID (from Find Contact or List Contacts).', required: true }),
    eventKey: Property.ShortText({ displayName: 'Event key', description: 'The custom event key (from Find Custom Event).', required: true }),
  },
  async run(context) {
    const p = context.propsValue;
    return tarventOperations.recordCustomEvent({ auth: context.auth.props, contactId: p.contactId, eventKey: p.eventKey });
  },
});
