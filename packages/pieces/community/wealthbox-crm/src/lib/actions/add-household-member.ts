import { Property, createAction } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient, wealthboxCommon } from '../common';

export const addHouseholdMemberAction = createAction({
  auth: wealthboxCrmAuth,
  name: 'add_household_member',
  displayName: 'Add Member to Household',
  description: 'Adds a member to an existing household',
  props: {
    household_id: Property.Number({
      displayName: 'Household ID',
      required: true,
    }),
    contact_id: wealthboxCommon.contactId,
    title: wealthboxCommon.householdTitle,
  },
  async run(context) {
    const { household_id, contact_id, title } = context.propsValue;
    
    const client = makeClient(context.auth);
    
    const memberData = {
      id: contact_id,
      title: title || 'Other Dependent',
    };

    const result = await client.addHouseholdMember(household_id, memberData);
    
    return result;
  },
});
