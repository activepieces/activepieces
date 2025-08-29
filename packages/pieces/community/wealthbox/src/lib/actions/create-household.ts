import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const createHousehold = createAction({
  name: 'create_household',
  displayName: 'Create Household',
  description: 'Creates a new household in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Household Name',
      description: 'The name of the household',
      required: true,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'Email addresses associated with the household',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to assign to the household',
      required: false,
    }),
  },
  async run(context) {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    
    const householdData: any = {
      name: context.propsValue.name,
    };

    if (context.propsValue.emails && context.propsValue.emails.length > 0) {
      householdData.emails = context.propsValue.emails;
    }

    if (context.propsValue.tags && context.propsValue.tags.length > 0) {
      householdData.tags = context.propsValue.tags;
    }

    const household = await client.createHousehold(householdData);
    return household;
  },
}); 