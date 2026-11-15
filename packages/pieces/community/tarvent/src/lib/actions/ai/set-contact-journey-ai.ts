import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../auth';
import { tarventOperations } from '../../common/operations';
import { tarventOutputSchemas } from '../../output-schemas';

export const setContactJourneyAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_set_contact_journey_ai',
  classification: 'WRITE',
  displayName: 'Enter or Exit Contact From Journey (AI)',
  description: 'Enters a contact into a journey, or removes it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Enters one Tarvent contact into an automation journey (ENTER), which can start the journey emails for that contact, or removes it (EXIT). Give the contact ID and journey ID (from Find Journey). Not idempotent: entering again can re-run journey steps.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.contactJourney,
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'The Tarvent contact ID (from Find Contact or List Contacts).', required: true }),
    journeyId: Property.ShortText({ displayName: 'Journey ID', description: 'The journey ID (from Find Journey).', required: true }),
    action: Property.StaticDropdown({ displayName: 'Action', description: 'ENTER or EXIT the journey.', required: true, options: { options: [{ label: 'Enter', value: 'ENTER' }, { label: 'Exit', value: 'EXIT' }] } }),
  },
  async run(context) {
    const p = context.propsValue;
    return tarventOperations.setContactJourney({ auth: context.auth.props, contactId: p.contactId, journeyId: p.journeyId, add: p.action === 'ENTER' });
  },
});
