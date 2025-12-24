import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../common/auth';
import { partyIdProp } from '../../common/props';
import { ENDPOINTS } from '../../common/constants';

export const updateParty = createAction({
  name: 'party_update',
  displayName: 'Party - Update',
  description: 'Update party (customer) information in Fiserv',
  auth: fiservAuth,
  props: {
    partyId: partyIdProp,

    // Person fields
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Updated first name',
      required: false,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      description: 'Updated middle name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Updated last name',
      required: false,
    }),

    // Organization fields
    organizationName: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Updated organization name',
      required: false,
    }),

    // Common fields
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Updated email address',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Updated phone number',
      required: false,
    }),
  },

  async run(context) {
    const {
      partyId, firstName, middleName, lastName,
      organizationName, email, phoneNumber
    } = context.propsValue;

    const auth = context.auth as any;

    const requestBody: any = {
      PartyKeys: {
        PartyId: partyId,
      },
    };

    // Add person info if any person fields are provided
    if (firstName || middleName || lastName) {
      requestBody.PersonPartyInfo = {
        PersonName: {},
      };
      if (firstName) requestBody.PersonPartyInfo.PersonName.FirstName = firstName;
      if (middleName) requestBody.PersonPartyInfo.PersonName.MiddleName = middleName;
      if (lastName) requestBody.PersonPartyInfo.PersonName.LastName = lastName;
    }

    // Add org info if provided
    if (organizationName) {
      requestBody.OrgPartyInfo = {
        OrgName: organizationName,
      };
    }

    // Add contact info if provided
    if (email || phoneNumber) {
      requestBody.ContactInfo = {};
      if (email) requestBody.ContactInfo.EmailAddr = email;
      if (phoneNumber) requestBody.ContactInfo.PhoneNum = phoneNumber;
    }

    const response = await callFiservApi(
      HttpMethod.PUT,
      auth,
      ENDPOINTS.PARTIES_UPDATE,
      requestBody
    );

    return response.body;
  },
});
