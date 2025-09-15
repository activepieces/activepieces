import { createAction } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { famulorAuth } from '../..';
import { famulorCommon } from '../common';

export const addLead = createAction({
  auth: famulorAuth,
  name: 'addLead',
  displayName: 'Add Lead to Campaign',
  description: 'Add a lead to an outbound campaign to be called by an AI assistant.',
  props: famulorCommon.addLeadProperties(),
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, famulorCommon.addLeadSchema);

    // Process secondary contacts if provided
    let secondaryContacts: Array<{ phone_number: string; variables?: Record<string, any> }> | undefined;
    
    if (propsValue.secondary_contacts && propsValue.num_secondary_contacts) {
      const secondaryContactsData = propsValue.secondary_contacts as Record<string, any>;
      const numContacts = Math.min(Number(propsValue.num_secondary_contacts) || 0, 10);
      const contacts: Array<{ phone_number: string; variables?: Record<string, any> }> = [];
      
      for (let i = 1; i <= numContacts; i++) {
        const phoneNumber = secondaryContactsData[`contact_${i}_phone`];
        const variables = secondaryContactsData[`contact_${i}_variables`];
        
        if (phoneNumber && phoneNumber.trim() !== '') {
          contacts.push({
            phone_number: phoneNumber,
            variables: variables || { customer_name: '' }
          });
        }
      }
      
      if (contacts.length > 0) {
        secondaryContacts = contacts;
      }
    }

    return await famulorCommon.addLead({
      auth: auth as string,
      campaign_id: propsValue.campaign,
      phone_number: propsValue.phone_number!,
      variable: propsValue.variables,
      allow_dupplicate: propsValue.allow_dupplicate,
      secondary_contacts: secondaryContacts,
    });
  },
});
