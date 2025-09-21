import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';
import { capsuleProps } from '../common/props';

export const updateContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update an existing contact in Capsule CRM',
  
  props: {
    contactId: capsuleProps.contactId,
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    emailAddress: Property.ShortText({
      displayName: 'Email Address',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
  },

  async run(context) {
    const { contactId, firstName, lastName, emailAddress, phoneNumber } = context.propsValue;

    const party: any = {};
    
    if (firstName) party.firstName = firstName;
    if (lastName) party.lastName = lastName;
    
    if (emailAddress) {
      party.emailAddresses = [{ type: 'Work', address: emailAddress }];
    }
    
    if (phoneNumber) {
      party.phoneNumbers = [{ type: 'Work', number: phoneNumber }];
    }

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.PUT,
      `/parties/${contactId}`,
      { party }
    );

    return response.party;
  },
});
