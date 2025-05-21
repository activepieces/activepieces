import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../..';
import { makeClient, tarventCommon } from '../common';

export const updateContactJourney = createAction({
  auth: tarventAuth,
  name: 'tarvent_update_contact_journey',
  displayName: 'Add/Remove A Contact From A Journey',
  description: 'Adds or removes the contact from a journey.',
  props: {
    contactId: tarventCommon.contactId,
    journeyId: tarventCommon.journeyId(true, 'Select which journey to start or stop.'),
    action: Property.StaticDropdown({
      displayName: 'Add or remove',
      description: 'Select whether to add or remove the contact from the journey.',
      required: true,
      options: {
        options: [
          {
            label: 'Add',

            value: 'Add',
          },
          {
            label: 'Remove',
            value: 'Remove',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { contactId, journeyId, action } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.addRemoveJourneyContact(action, contactId, journeyId);
  },
});
