import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../common/auth';
import { BiginClient } from '../common/client';
import { buildSearchCriteria } from '../common/utils';

export const searchContactAction = createAction({
  auth: biginAuth,
  name: 'search_contact',
  displayName: 'Search Contact',
  description: 'Search for contacts by name, email, or phone number',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Field to search by',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'Email' },
          { label: 'First Name', value: 'First_Name' },
          { label: 'Last Name', value: 'Last_Name' },
          { label: 'Phone', value: 'Phone' },
          { label: 'Mobile', value: 'Mobile' }
        ]
      }
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for',
      required: true
    }),
    searchOperator: Property.StaticDropdown({
      displayName: 'Search Operator',
      description: 'How to match the search value',
      required: false,
      defaultValue: 'equals',
      options: {
        options: [
          { label: 'Equals', value: 'equals' },
          { label: 'Contains', value: 'contains' },
          { label: 'Starts With', value: 'starts_with' },
          { label: 'Ends With', value: 'ends_with' }
        ]
      }
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of contacts to return (default: 200)',
      required: false,
      defaultValue: 200
    })
  },
  async run(context) {
    const { searchBy, searchValue, searchOperator, limit } = context.propsValue;
    const client = new BiginClient(context.auth);

    try {
      // Build search criteria
      const criteria = buildSearchCriteria(searchBy, searchValue, searchOperator || 'equals');
      
      // Perform search
      const response = await client.searchRecords('Contacts', criteria, {
        per_page: (limit || 200).toString()
      });

      return {
        success: true,
        data: response.data || [],
        info: response.info || {}
      };
    } catch (error: any) {
      throw new Error(`Failed to search contacts: ${error.message}`);
    }
  }
});
