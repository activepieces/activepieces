import { createAction } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoft365PeopleAuth, microsoft365PeopleCommon } from '../common';

interface ContactResponse {
  id: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  emailAddresses?: Array<{
    name: string;
    address: string;
  }>;
  businessPhones?: string[];
  mobilePhone?: string;
  jobTitle?: string;
  companyName?: string;
  department?: string;
  officeLocation?: string;
  birthday?: string;
  personalNotes?: string;
  categories?: string[];
  createdDateTime?: string;
  lastModifiedDateTime?: string;
  changeKey?: string;
  parentFolderId?: string;
}

export const getContact = createAction({
  auth: microsoft365PeopleAuth,
  name: 'search-contacts',
  displayName: 'Search Contacts',
  description: 'Retrieve the properties and relationships of a contact object by ID',
  props: {
    contactId: microsoft365PeopleCommon.contactId,
    userId: microsoft365PeopleCommon.userId,
    contactFolderId: microsoft365PeopleCommon.contactFolderId,
    expandRelationships: microsoft365PeopleCommon.expandRelationships,
    selectProperties: microsoft365PeopleCommon.selectProperties,
  },
  async run({ auth, propsValue }) {
    try {
      const authValue = auth as { access_token: string };
      const client = Client.initWithMiddleware({
        authProvider: {
          getAccessToken: () => Promise.resolve(authValue.access_token),
        },
      });

      // Build the API endpoint
      let endpoint = '/me/contacts/';
      
      if (propsValue.userId) {
        endpoint = `/users/${propsValue.userId}/contacts/`;
      }

      // Add contact folder path if specified
      if (propsValue.contactFolderId) {
        if (propsValue.userId) {
          endpoint = `/users/${propsValue.userId}/contactFolders/${propsValue.contactFolderId}/contacts/`;
        } else {
          endpoint = `/me/contactFolders/${propsValue.contactFolderId}/contacts/`;
        }
      }

      // Add the contact ID
      endpoint += propsValue.contactId;

      // Build query parameters
      const queryParams: string[] = [];
      
      if (propsValue.expandRelationships) {
        queryParams.push('$expand=extensions');
      }
      
      if (propsValue.selectProperties) {
        queryParams.push(`$select=${propsValue.selectProperties}`);
      }

      if (queryParams.length > 0) {
        endpoint += `?${queryParams.join('&')}`;
      }

      // Get the contact
      const contact = await client.api(endpoint).get() as ContactResponse;

      return {
        success: true,
        contact: contact,
        message: 'Contact retrieved successfully',
        contactId: contact.id,
        displayName: contact.displayName,
        emailAddresses: contact.emailAddresses || [],
        phoneNumbers: {
          business: contact.businessPhones || [],
          mobile: contact.mobilePhone,
        },
        companyInfo: {
          jobTitle: contact.jobTitle,
          companyName: contact.companyName,
          department: contact.department,
          officeLocation: contact.officeLocation,
        },
        personalInfo: {
          givenName: contact.givenName,
          surname: contact.surname,
          birthday: contact.birthday,
          personalNotes: contact.personalNotes,
        },
        metadata: {
          createdDateTime: contact.createdDateTime,
          lastModifiedDateTime: contact.lastModifiedDateTime,
          changeKey: contact.changeKey,
          parentFolderId: contact.parentFolderId,
          categories: contact.categories || [],
        },
        endpoint: endpoint,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve contact';
      return {
        success: false,
        error: errorMessage,
        details: error,
        contactId: propsValue.contactId,
        userId: propsValue.userId,
        contactFolderId: propsValue.contactFolderId,
      };
    }
  },
});
