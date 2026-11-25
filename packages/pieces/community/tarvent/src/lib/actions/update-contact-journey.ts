import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventOperations } from '../common/operations';
import { tarventOutputSchemas } from '../output-schemas';

export const updateContactJourney = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_contact_journey',
  classification: 'WRITE',
  displayName: 'Add/Remove A Contact From A Journey',
  description: 'Adds or removes the contact from a journey.',
  audience: 'human',
  aiMetadata: {
    description:
      'Enters one Tarvent contact into an automation journey, or removes it, by contact ID and journey ID. Entering can start the journey\'s emails for that contact. Returns the contact ID, journey ID and action. Not idempotent on add: re-entering can re-run journey steps, depending on the journey\'s re-entry setting.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.contactJourney,
  props: {
    contactId: tarventCommon.contactId,
    journeyId: tarventCommon.journeyId(true, 'Journey to add the contact to or remove it from.'),
    action: Property.StaticDropdown({
      displayName: 'Add or remove',
      description: 'Select whether to add or remove the contact from the journey.',
      required: true,
      options: {
        options: [
          { label: 'Add', value: 'Add' },
          { label: 'Remove', value: 'Remove' },
        ],
      },
    }),
  },
  async run(context) {
    return tarventOperations.setContactJourney({ auth: context.auth.props, contactId: context.propsValue.contactId, journeyId: context.propsValue.journeyId, add: context.propsValue.action === 'Add' });
  },
});
