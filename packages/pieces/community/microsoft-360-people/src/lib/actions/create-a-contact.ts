import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoft365PeopleAuth, microsoft365PeopleCommon } from '../common';

interface ContactEmail {
  address: string;
  name?: string;
}

interface ContactAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  countryOrRegion?: string;
}

interface ContactIMAddress {
  address: string;
  protocol?: string;
}

interface MicrosoftContact {
  givenName?: string;
  surname?: string;
  displayName?: string;
  emailAddresses?: ContactEmail[];
  businessPhones?: string[];
  mobilePhone?: string;
  homePhones?: string[];
  jobTitle?: string;
  companyName?: string;
  department?: string;
  officeLocation?: string;
  businessAddress?: ContactAddress;
  homeAddress?: ContactAddress;
  birthday?: string;
  notes?: string;
  websites?: Array<{ address: string; name: string }>;
  imAddresses?: ContactIMAddress[];
}

export const createAContact = createAction({
  auth: microsoft365PeopleAuth,
  name: 'create-a-contact',
  displayName: 'Create Contact',
  description: 'Create a new contact in Microsoft 365 People with detailed attributes',
  props: {
    givenName: microsoft365PeopleCommon.givenName,
    surname: microsoft365PeopleCommon.surname,
    displayName: microsoft365PeopleCommon.displayName,
    emailAddresses: microsoft365PeopleCommon.emailAddresses,
    businessPhones: microsoft365PeopleCommon.businessPhones,
    mobilePhone: microsoft365PeopleCommon.mobilePhone,
    homePhones: microsoft365PeopleCommon.homePhones,
    jobTitle: microsoft365PeopleCommon.jobTitle,
    companyName: microsoft365PeopleCommon.companyName,
    department: microsoft365PeopleCommon.department,
    officeLocation: microsoft365PeopleCommon.officeLocation,
    businessAddress: Property.Object({
      displayName: 'Business Address',
      description: 'Business address information',
      required: false,
    }),
    homeAddress: Property.Object({
      displayName: 'Home Address',
      description: 'Home address information',
      required: false,
    }),
    birthday: microsoft365PeopleCommon.birthday,
    notes: microsoft365PeopleCommon.notes,
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Personal website URL',
      required: false,
    }),
    imAddresses: Property.Array({
      displayName: 'Instant Message Addresses',
      description: 'List of instant message addresses',
      required: false,
    }),
    contactFolderId: microsoft365PeopleCommon.contactFolderId,
    userId: microsoft365PeopleCommon.userId,
  },
  async run({ auth, propsValue }) {
    try {
      // Validate that at least one name field is provided
      if (!propsValue.givenName && !propsValue.surname && !propsValue.displayName) {
        return {
          success: false,
          error: 'At least one of the following fields must be provided: Given Name, Surname, or Display Name',
        };
      }

      const authValue = auth as { access_token: string };
      const client = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: () => Promise.resolve(authValue.access_token),
        },
      });

      // Build the contact object
      const contact: MicrosoftContact = {};
      
      // Add required properties if provided
      if (propsValue.givenName) {
        contact.givenName = propsValue.givenName;
      }
      
      if (propsValue.surname) {
        contact.surname = propsValue.surname;
      }

      // Add optional properties if provided
      if (propsValue.displayName) {
        contact.displayName = propsValue.displayName;
      }

      if (propsValue.emailAddresses && propsValue.emailAddresses.length > 0) {
        contact.emailAddresses = (propsValue.emailAddresses as ContactEmail[]).map((email: ContactEmail) => ({
          address: email.address,
          name: email.name || `${propsValue.givenName} ${propsValue.surname}`,
        }));
      }

      if (propsValue.businessPhones && propsValue.businessPhones.length > 0) {
        contact.businessPhones = propsValue.businessPhones as string[];
      }

      if (propsValue.mobilePhone) {
        contact.mobilePhone = propsValue.mobilePhone;
      }

      if (propsValue.homePhones && propsValue.homePhones.length > 0) {
        contact.homePhones = propsValue.homePhones as string[];
      }

      if (propsValue.jobTitle) {
        contact.jobTitle = propsValue.jobTitle;
      }

      if (propsValue.companyName) {
        contact.companyName = propsValue.companyName;
      }

      if (propsValue.department) {
        contact.department = propsValue.department;
      }

      if (propsValue.officeLocation) {
        contact.officeLocation = propsValue.officeLocation;
      }

      if (propsValue.businessAddress) {
        contact.businessAddress = propsValue.businessAddress;
      }

      if (propsValue.homeAddress) {
        contact.homeAddress = propsValue.homeAddress;
      }

      if (propsValue.birthday) {
        contact.birthday = propsValue.birthday;
      }

      if (propsValue.notes) {
        contact.notes = propsValue.notes;
      }

      if (propsValue.website) {
        contact.websites = [{
          address: propsValue.website,
          name: 'Personal Website',
        }];
      }

      if (propsValue.imAddresses && propsValue.imAddresses.length > 0) {
        contact.imAddresses = propsValue.imAddresses as ContactIMAddress[];
      }

      // Determine the API endpoint
      let endpoint = '/me/contacts';
      
      if (propsValue.userId) {
        if (propsValue.contactFolderId) {
          endpoint = `/users/${propsValue.userId}/contactFolders/${propsValue.contactFolderId}/contacts`;
        } else {
          endpoint = `/users/${propsValue.userId}/contacts`;
        }
      } else if (propsValue.contactFolderId) {
        endpoint = `/me/contactFolders/${propsValue.contactFolderId}/contacts`;
      }

      // Create the contact
      const createdContact = await client.api(endpoint).post(contact);

      return {
        success: true,
        contact: createdContact,
        message: 'Contact created successfully',
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create contact';
      return {
        success: false,
        error: errorMessage,
        details: error,
      };
    }
  },
});
