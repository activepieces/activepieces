import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoft365Auth } from '../common/auth';
import { microsoft365PeopleCommon } from '../common/client';

export const searchContacts = createAction({
  auth: microsoft365Auth,
  name: 'searchContacts',
  displayName: 'Search Contacts',
  description: 'Find contacts by name, email, or other properties',
  props: {
    emailAddress: Property.ShortText({
      displayName: 'Email Address',
      description: 'Search for contacts with a specific email address',
      required: false,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'Search for contacts with a specific display name',
      required: false,
    }),
    givenName: Property.ShortText({
      displayName: 'First Name',
      description: 'Search for contacts with a specific first name',
      required: false,
    }),
    surname: Property.ShortText({
      displayName: 'Last Name',
      description: 'Search for contacts with a specific last name',
      required: false,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: 'Search for contacts from a specific company',
      required: false,
    }),
    folderId: Property.ShortText({
      displayName: 'Contact Folder ID',
      description: 'Limit search to a specific contact folder (optional)',
      required: false,
    }),
    orderBy: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort the results by a specific field',
      required: false,
      defaultValue: 'displayName',
      options: {
        options: [
          { label: 'Display Name', value: 'displayName' },
          { label: 'Given Name', value: 'givenName' },
          { label: 'Surname', value: 'surname' },
          { label: 'Company Name', value: 'companyName' },
          { label: 'Created Date', value: 'createdDateTime' },
          { label: 'Modified Date', value: 'lastModifiedDateTime' },
        ],
      },
    }),
    maxResults: Property.Number({
      displayName: 'Maximum Results',
      description:
        'Maximum number of contacts to return (default: 50, max: 999)',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      let contacts;

      if (propsValue.emailAddress) {
        contacts = await microsoft365PeopleCommon.searchContactsByEmail(
          auth,
          propsValue.emailAddress
        );
      }
      return {
        success: true,
        contacts: contacts,
      };
    } catch (error) {
      throw new Error(`Failed to search contacts: ${error}`);
    }
  },
});
