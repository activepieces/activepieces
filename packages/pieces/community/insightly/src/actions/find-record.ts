import { createAction, Property } from '@activepieces/pieces-framework';
import { makeInsightlyRequest , insightlyAuth, INSIGHTLY_OBJECTS } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';


export const findRecordAction = createAction({
  auth: insightlyAuth,
  name: 'find_record',
  displayName: 'Find Record',
  description: 'Look up an existing record by a search field and value',
  props: {
    objectType: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'The type of Insightly object to search',
      required: true,
      options: {
        options: INSIGHTLY_OBJECTS.map(obj => ({
          label: obj,
          value: obj,
        })),
      },
    }),
    searchField: Property.ShortText({
      displayName: 'Search Field',
      description: 'The field name to search by (e.g., EMAIL, FIRST_NAME)',
      required: true,
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'The value to search for',
      required: true,
    }),
  },
  async run(context) {
    const objectType = context.propsValue.objectType;
    const searchField = context.propsValue.searchField;
    const searchValue = context.propsValue.searchValue;
    const response = await makeInsightlyRequest(
      context.auth,
      `/${objectType}?brief=false`
    );

    const records = response.body || [];
    
    const matchingRecords = records.filter((record: any) => {
      const fieldValue = record[searchField.toUpperCase()];
      if (fieldValue === undefined || fieldValue === null) return false;
      return String(fieldValue).toLowerCase().includes(searchValue.toLowerCase());
    });

    return matchingRecords;
  },
});
