import { createAction, Property } from '@activepieces/pieces-framework';
import { smooveAuth } from '../common/auth';
import { contactIdDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const unsubscribe = createAction({
  auth: smooveAuth, 
  name: 'unsubscribe',
  displayName: 'Unsubscribe Subscriber',
  description: 'Unsubscribe a contact from all lists and move them to the "Unsubscribed" list',
  audience: 'both',
  aiMetadata: { description: 'Unsubscribe a Smoove contact from all lists and move them to the Unsubscribed list, recording a reason. Use to opt a subscriber out of all communications. Requires a contact ID; not idempotent — it posts a state-changing unsubscribe with a reason on each call.', idempotent: false },
  props: {
    contactId: contactIdDropdown,
    reason: Property.ShortText({
      displayName: 'Unsubscribe Reason',
      description: 'Reason for unsubscribing the contact',
      required: true,
      defaultValue: 'Unsubscribed via automation'
    })
  },
  async run({ auth, propsValue }) {
    const { contactId, reason } = propsValue;
    
    const contactIdStr = contactId as string;
    if (!contactIdStr || contactIdStr.trim() === '') {
      throw new Error('Please select a contact from the dropdown');
    }

    const body = {
      reason: reason || 'Unsubscribed via automation'
    };

    const response = await makeRequest(
      auth.secret_text, 
      HttpMethod.POST, 
      `/Contacts/${encodeURIComponent(contactIdStr.trim())}/Unsubscribe?by=ContactId`,
      body
    );
    
    return response;
  },
});
