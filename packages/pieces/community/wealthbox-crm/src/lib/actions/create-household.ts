import { Property, createAction } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient } from '../common';

export const createHouseholdAction = createAction({
  auth: wealthboxCrmAuth,
  name: 'create_household',
  displayName: 'Create Household',
  description: 'Creates a household record with emails and tags',
  props: {
    name: Property.ShortText({
      displayName: 'Household Name',
      required: true,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      required: false,
      items: Property.ShortText({
        displayName: 'Email',
        required: true,
      }),
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      items: Property.ShortText({
        displayName: 'Tag',
        required: true,
      }),
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
  },
  async run(context) {
    const { name, emails, tags, notes } = context.propsValue;
    
    const client = makeClient(context.auth);
    
    const householdData: any = {
      name,
      type: 'Household',
    };

    if (emails && emails.length > 0) {
      householdData.emails = emails;
    }
    if (tags && tags.length > 0) {
      householdData.tags = tags;
    }
    if (notes) {
      householdData.notes = notes;
    }

    const result = await client.createContact(householdData);
    
    return result;
  },
});
