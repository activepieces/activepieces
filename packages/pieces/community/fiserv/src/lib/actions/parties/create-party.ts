import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../common/auth';
import { partyTypeProp } from '../../common/props';
import { ENDPOINTS } from '../../common/constants';

export const createParty = createAction({
  name: 'party_create',
  displayName: 'Party - Create',
  description: 'Create a new party (customer) in Fiserv',
  auth: fiservAuth,
  props: {
    partyType: partyTypeProp,

    // Person fields
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name (for Person type)',
      required: false,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      description: 'Middle name (for Person type)',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name (for Person type)',
      required: false,
    }),
    birthDate: Property.ShortText({
      displayName: 'Birth Date',
      description: 'Birth date in YYYY-MM-DD format (for Person type)',
      required: false,
    }),

    // Organization fields
    organizationName: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Organization name (for Organization type)',
      required: false,
    }),
    establishedDate: Property.ShortText({
      displayName: 'Established Date',
      description: 'Date established in YYYY-MM-DD format (for Organization type)',
      required: false,
    }),

    // Common fields
    taxId: Property.ShortText({
      displayName: 'Tax ID',
      description: 'Tax identification number (SSN for person, EIN for organization)',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Primary email address',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Primary phone number',
      required: false,
    }),
  },

  async run(context) {
    const {
      partyType, firstName, middleName, lastName, birthDate,
      organizationName, establishedDate, taxId, email, phoneNumber
    } = context.propsValue;

    const auth = context.auth as any;

    // Build request body based on party type
    const requestBody: any = {
      PartyType: partyType,
    };

    if (partyType === 'Person') {
      requestBody.PersonPartyInfo = {
        PersonName: {
          FirstName: firstName,
          MiddleName: middleName,
          LastName: lastName,
        },
        TaxIdent: taxId,
        BirthDt: birthDate,
      };
    } else {
      requestBody.OrgPartyInfo = {
        OrgName: organizationName,
        TaxIdent: taxId,
        EstablishedDt: establishedDate,
      };
    }

    // Add contact info if provided
    if (email || phoneNumber) {
      requestBody.ContactInfo = {};
      if (email) {
        requestBody.ContactInfo.EmailAddr = email;
      }
      if (phoneNumber) {
        requestBody.ContactInfo.PhoneNum = phoneNumber;
      }
    }

    const response = await callFiservApi(
      HttpMethod.POST,
      auth,
      ENDPOINTS.PARTIES_ADD,
      requestBody
    );

    return response.body;
  },
});
