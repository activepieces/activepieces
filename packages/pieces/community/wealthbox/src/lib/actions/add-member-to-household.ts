import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const addMemberToHousehold = createAction({
  name: 'add_member_to_household',
  displayName: 'Add Member to Household',
  description: 'Adds a member to an existing household in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    household_id: Property.ShortText({
      displayName: 'Household ID',
      description: 'The ID of the household to add the member to',
      required: true,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to add to the household',
      required: true,
    }),
  },
  async run(context) {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    
    await client.addMemberToHousehold(
      context.propsValue.household_id,
      context.propsValue.contact_id
    );
    
    return {
      success: true,
      message: `Contact ${context.propsValue.contact_id} added to household ${context.propsValue.household_id}`,
    };
  },
}); 