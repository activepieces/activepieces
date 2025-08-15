import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoft365PeopleAuth } from '../auth';

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

interface MicrosoftContactUpdate {
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

export const updateAContact = createAction({
  auth: microsoft365PeopleAuth,
  name: 'update-a-contact',
  displayName: 'Update Contact',
  description: 'Modify fields of an existing contact in Microsoft 365 People',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The unique identifier of the contact to update',
      required: true,
    }),
    givenName: Property.ShortText({
      displayName: 'Given Name',
      description: 'The first name of the contact',
      required: false,
    }),
    surname: Property.ShortText({
      displayName: 'Surname',
      description: 'The last name of the contact',
      required: false,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'The display name of the contact',
      required: false,
    }),
    emailAddresses: Property.Array({
      displayName: 'Email Addresses',
      description: 'List of email addresses for the contact',
      required: false,
    }),
    businessPhones: Property.Array({
      displayName: 'Business Phone Numbers',
      description: 'List of business phone numbers',
      required: false,
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      description: 'Mobile phone number',
      required: false,
    }),
    homePhones: Property.Array({
      displayName: 'Home Phone Numbers',
      description: 'List of home phone numbers',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'The job title of the contact',
      required: false,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: 'The company name of the contact',
      required: false,
    }),
    department: Property.ShortText({
      displayName: 'Department',
      description: 'The department of the contact',
      required: false,
    }),
    officeLocation: Property.ShortText({
      displayName: 'Office Location',
      description: 'The office location of the contact',
      required: false,
    }),
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
    birthday: Property.DateTime({
      displayName: 'Birthday',
      description: 'The birthday of the contact',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes about the contact',
      required: false,
    }),
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
    contactFolderId: Property.ShortText({
      displayName: 'Contact Folder ID',
      description: 'Optional: ID of the contact folder if the contact is in a specific folder. Leave empty if contact is in root contacts folder.',
      required: false,
    }),
    userId: Property.ShortText({
      displayName: 'User ID or Principal Name',
      description: 'Optional: User ID or principal name if updating contact for another user. Leave empty to update contact for current user.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const authValue = auth as { access_token: string };
      const client = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: () => Promise.resolve(authValue.access_token),
        },
      });

      // Build the contact update object
      const contactUpdate: MicrosoftContactUpdate = {};

      // Add properties if provided
      if (propsValue.givenName) {
        contactUpdate.givenName = propsValue.givenName;
      }

      if (propsValue.surname) {
        contactUpdate.surname = propsValue.surname;
      }

      if (propsValue.displayName) {
        contactUpdate.displayName = propsValue.displayName;
      }

      if (propsValue.emailAddresses && propsValue.emailAddresses.length > 0) {
        contactUpdate.emailAddresses = (propsValue.emailAddresses as ContactEmail[]).map((email: ContactEmail) => ({
          address: email.address,
          name: email.name || `${propsValue.givenName || ''} ${propsValue.surname || ''}`.trim() || 'Email',
        }));
      }

      if (propsValue.businessPhones && propsValue.businessPhones.length > 0) {
        contactUpdate.businessPhones = propsValue.businessPhones as string[];
      }

      if (propsValue.mobilePhone) {
        contactUpdate.mobilePhone = propsValue.mobilePhone;
      }

      if (propsValue.homePhones && propsValue.homePhones.length > 0) {
        contactUpdate.homePhones = propsValue.homePhones as string[];
      }

      if (propsValue.jobTitle) {
        contactUpdate.jobTitle = propsValue.jobTitle;
      }

      if (propsValue.companyName) {
        contactUpdate.companyName = propsValue.companyName;
      }

      if (propsValue.department) {
        contactUpdate.department = propsValue.department;
      }

      if (propsValue.officeLocation) {
        contactUpdate.officeLocation = propsValue.officeLocation;
      }

      if (propsValue.businessAddress) {
        contactUpdate.businessAddress = propsValue.businessAddress;
      }

      if (propsValue.homeAddress) {
        contactUpdate.homeAddress = propsValue.homeAddress;
      }

      if (propsValue.birthday) {
        contactUpdate.birthday = propsValue.birthday;
      }

      if (propsValue.notes) {
        contactUpdate.notes = propsValue.notes;
      }

      if (propsValue.website) {
        contactUpdate.websites = [{
          address: propsValue.website,
          name: 'Personal Website',
        }];
      }

      if (propsValue.imAddresses && propsValue.imAddresses.length > 0) {
        contactUpdate.imAddresses = propsValue.imAddresses as ContactIMAddress[];
      }

      // Determine the API endpoint
      let endpoint = `/me/contacts/${propsValue.contactId}`;
      
      if (propsValue.userId) {
        if (propsValue.contactFolderId) {
          endpoint = `/users/${propsValue.userId}/contactFolders/${propsValue.contactFolderId}/contacts/${propsValue.contactId}`;
        } else {
          endpoint = `/users/${propsValue.userId}/contacts/${propsValue.contactId}`;
        }
      } else if (propsValue.contactFolderId) {
        endpoint = `/me/contactFolders/${propsValue.contactFolderId}/contacts/${propsValue.contactId}`;
      }

      // Update the contact using PATCH method
      const updatedContact = await client.api(endpoint).patch(contactUpdate);

      return {
        success: true,
        contact: updatedContact,
        message: 'Contact updated successfully',
        updatedFields: Object.keys(contactUpdate),
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update contact';
      return {
        success: false,
        error: errorMessage,
        details: error,
      };
    }
  },
});
