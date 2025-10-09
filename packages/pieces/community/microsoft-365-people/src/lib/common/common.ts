import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { Contact, ContactFolder } from '@microsoft/microsoft-graph-types';

export type authProps = { auth: OAuth2PropertyValue };

type createContactProps = authProps & { contact: Contact };

type listContactProps = authProps & { queryParams?: Record<string, any> };

type updateContactProps = authProps & { contactId: string; contact: Contact };

type getContactProps = authProps & { contactId: string };

type deleteContactProps = getContactProps;

type createContactFolderProps = authProps & { contactFolder: ContactFolder };

type getContactFolderProps = authProps & { contactFolderId: string };

type deleteContactFolderProps = getContactFolderProps;

export const microsoft365PeopleCommon = {
  // Initialize Microsoft Graph client
  getClient: ({ auth }: authProps) => {
    return Client.initWithMiddleware({
      authProvider: {
        getAccessToken: () => Promise.resolve(auth.access_token),
      },
    });
  },

  // Logged user profile
  getMe: async ({ auth }: authProps) => {
    const client = microsoft365PeopleCommon.getClient({ auth });
    const user = await client.api('/me').get();
    return user;
  },

  // Contact methods
  getContact: async ({ auth, contactId }: getContactProps) => {
    const client = microsoft365PeopleCommon.getClient({ auth });
    const response = await client.api(`/me/contacts/${contactId}`).get();
    return response;
  },
  listContacts: async ({
    auth,
    queryParams,
  }: listContactProps): Promise<Contact[]> => {
    const client = microsoft365PeopleCommon.getClient({ auth });
    let apiRequest = client.api('/me/contacts');
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        apiRequest = apiRequest.query({ [key]: value });
      });
    }
    const response = await apiRequest.get();
    return response.value;
  },
  createContact: async ({ auth, contact }: createContactProps) => {
    const client = microsoft365PeopleCommon.getClient({ auth });
    const response = await client.api('/me/contacts').post(contact);
    return response;
  },
  updateContact: async ({ auth, contactId, contact }: updateContactProps) => {
    const client = microsoft365PeopleCommon.getClient({ auth });
    const response = await client
      .api(`/me/contacts/${contactId}`)
      .patch(contact);
    return response;
  },
  deleteContact: async ({ auth, contactId }: deleteContactProps) => {
    const client = microsoft365PeopleCommon.getClient({ auth });
    await client.api(`/me/contacts/${contactId}`).delete();
    return { success: true };
  },

  // Contact folder methods
  listContactFolders: async ({ auth }: authProps): Promise<ContactFolder[]> => {
    const client = microsoft365PeopleCommon.getClient({ auth });
    const response = await client.api('/me/contactFolders').get();
    return response.value;
  },
  createContactFolder: async ({
    auth,
    contactFolder,
  }: createContactFolderProps) => {
    const client = microsoft365PeopleCommon.getClient({ auth });
    const response = await client.api('/me/contactFolders').post(contactFolder);
    return response;
  },
  getContactFolder: async ({
    auth,
    contactFolderId,
  }: getContactFolderProps) => {
    const client = microsoft365PeopleCommon.getClient({ auth });
    const response = await client
      .api(`/me/contactFolders/${contactFolderId}`)
      .get();
    return response;
  },

  deleteContactFolder: async ({
    auth,
    contactFolderId,
  }: deleteContactFolderProps) => {
    const client = microsoft365PeopleCommon.getClient({ auth });
    await client.api(`/me/contactFolders/${contactFolderId}`).delete();
    return { success: true };
  },

  // Dropdowns
  contactDropdown: (
    displayName = 'Contact',
    description = 'Select a Contact',
    required = true
  ) =>
    Property.Dropdown({
      displayName,
      description,
      required,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }

        const contacts = await microsoft365PeopleCommon.listContacts({
          auth: auth as OAuth2PropertyValue,
        });
        const options = contacts.map((contact) => ({
          label: contact.displayName ?? '',
          value: contact.id,
        }));
        return {
          placeholder:
            options.length === 0
              ? "You don't have any contacts."
              : 'Select a contact',
          options: options,
          disabled: options.length === 0,
        };
      },
    }),
  contactFolderDropdown: (
    displayName = 'Contact Folder',
    description = 'Select an option',
    required = true
  ) =>
    Property.Dropdown({
      displayName,
      description,
      required,
      refreshers: ['auth'],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
          };
        }
        const contactFolders =
          await microsoft365PeopleCommon.listContactFolders({
            auth: auth as OAuth2PropertyValue,
          });
        const options = contactFolders.map((folder) => ({
          label: folder.displayName ?? '',
          value: folder.id,
        }));
        return {
          placeholder:
            options.length === 0
              ? "You don't have any folders created."
              : 'Select a folder',
          options: options,
          disabled: options.length === 0,
        };
      },
    }),

  // Properties
  contactProperties: () => ({
    displayName: Property.ShortText({
      displayName: 'Display Name',
      required: false,
    }),
    givenName: Property.ShortText({
      displayName: 'Given Name',
      required: false,
    }),
    middleName: Property.ShortText({
      displayName: 'Middle Name',
      required: false,
    }),
    surname: Property.ShortText({
      displayName: 'Surname',
      required: false,
    }),
    emailAddresses: Property.Array({
      displayName: 'Email Addresses',
      required: false,
      properties: {
        address: Property.ShortText({
          displayName: 'Email Address',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Name',
          required: false,
        }),
      },
    }),
    mobilePhone: Property.ShortText({
      displayName: 'Mobile Phone',
      required: false,
    }),
    assistantName: Property.ShortText({
      displayName: 'Assistant Name',
      required: false,
    }),
    birthday: Property.DateTime({
      displayName: 'Birthday',
      required: false,
    }),
    businessStreet: Property.ShortText({
      displayName: 'Business Street',
      required: false,
    }),
    businessCity: Property.ShortText({
      displayName: 'Business City',
      required: false,
    }),
    businessState: Property.ShortText({
      displayName: 'Business State',
      required: false,
    }),
    businessPostalCode: Property.ShortText({
      displayName: 'Business Postal Code',
      required: false,
    }),
    businessCountryOrRegion: Property.ShortText({
      displayName: 'Business Country or Region',
      required: false,
    }),
    children: Property.Array({
      displayName: 'Children',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          required: true,
        }),
      },
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    department: Property.ShortText({
      displayName: 'Department',
      required: false,
    }),
    homeStreet: Property.ShortText({
      displayName: 'Home Street',
      required: false,
    }),
    homeCity: Property.ShortText({
      displayName: 'Home City',
      required: false,
    }),
    homeState: Property.ShortText({
      displayName: 'Home State',
      required: false,
    }),
    homePostalCode: Property.ShortText({
      displayName: 'Home Postal Code',
      required: false,
    }),
    homeCountryOrRegion: Property.ShortText({
      displayName: 'Home Country or Region',
      required: false,
    }),
    imAddresses: Property.Array({
      displayName: 'Instant Messaging Addresses',
      required: false,
      properties: {
        address: Property.ShortText({
          displayName: 'IM Address',
          required: true,
        }),
      },
    }),
    initials: Property.ShortText({
      displayName: 'Initials',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    manager: Property.ShortText({
      displayName: 'Manager',
      required: false,
    }),
    nickName: Property.ShortText({
      displayName: 'Nick Name',
      required: false,
    }),
    officeLocation: Property.ShortText({
      displayName: 'Office Location',
      required: false,
    }),
    otherStreet: Property.ShortText({
      displayName: 'Other Street',
      required: false,
    }),
    otherCity: Property.ShortText({
      displayName: 'Other City',
      required: false,
    }),
    otherState: Property.ShortText({
      displayName: 'Other State',
      required: false,
    }),
    otherPostalCode: Property.ShortText({
      displayName: 'Other Postal Code',
      required: false,
    }),
    otherCountryOrRegion: Property.ShortText({
      displayName: 'Other Country or Region',
      required: false,
    }),
    parentFolder: microsoft365PeopleCommon.contactFolderDropdown(
      'Parent Folder',
      'Select a parent folder',
      false
    ),
    personalNotes: Property.LongText({
      displayName: 'Personal Notes',
      required: false,
    }),
    profession: Property.ShortText({
      displayName: 'Profession',
      required: false,
    }),
    spouseName: Property.ShortText({
      displayName: 'Spouse Name',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
  }),
  contactFolderProperties: () => ({
    displayName: Property.ShortText({
      displayName: 'Contact Folder Name',
      required: true,
    }),
    parentFolder: microsoft365PeopleCommon.contactFolderDropdown(
      'Parent Folder',
      'Select a parent folder',
      false
    ),
  }),
};


