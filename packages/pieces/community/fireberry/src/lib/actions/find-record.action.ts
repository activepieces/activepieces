import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { fireberryAuth } from '../auth';
import { objectTypeDropdown, fireberryProps } from '../common/props';
import { FireberryClient, fireberryUtils } from '../common/client';
import { fireberryOutputSchemas } from '../common/output-schemas';

const fieldsToReturn = Property.DynamicProperties({
  displayName: 'Fields to Return',
  refreshers: ['objectType'],
  required: false,
  auth: fireberryAuth,
  props: async ({ auth, objectType }) => {
    const props: DynamicPropsValue = {};
    const objectSystemName = fireberryProps.objectTypeValue(objectType);
    if (!auth || !objectSystemName) return props;
    const fields = await new FireberryClient(auth.secret_text).getObjectFieldsMetadata(objectSystemName);
    for (const field of fields) {
      if (field.fieldName.endsWith('id') && !field.label) continue;
      if (['createdby', 'modifiedby', 'deletedby'].includes(field.fieldName.toLowerCase())) continue;
      props[field.fieldName] = Property.Checkbox({
        displayName: field.label || field.fieldName,
        required: false,
        description: `Include ${field.label || field.fieldName} in search results`,
      });
    }
    return props;
  },
});

export const findRecordAction = createAction({
  name: 'find_record',
  classification: 'SEARCH',
  displayName: 'Find Records',
  description: 'Search for records in Fireberry.',
  audience: 'human',
  auth: fireberryAuth,
  outputSchema: fireberryOutputSchemas['findRecords'],
  props: {
    objectType: objectTypeDropdown,
    searchQuery: Property.LongText({
      displayName: 'Search Query',
      required: false,
      description: "Fireberry query syntax, e.g. (accountname = 'Acme') or (emailaddress1 start-with 'john'). Combine conditions with and / or. Leave empty to get all records.",
    }),
    fieldsToReturn: fieldsToReturn,
    sortBy: Property.ShortText({
      displayName: 'Sort By Field',
      required: false,
      description: 'System name of field to sort by (e.g., "createdon", "accountname")',
    }),
    sortOrder: Property.StaticDropdown({
      displayName: 'Sort Order',
      required: false,
      defaultValue: 'desc',
      options: {
        disabled: false,
        options: [
          { label: 'Descending (newest first)', value: 'desc' },
          { label: 'Ascending (oldest first)', value: 'asc' },
        ],
      },
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      required: false,
      defaultValue: 25,
      description: 'Number of records to return (1-50)',
    }),
    pageNumber: Property.Number({
      displayName: 'Page Number',
      required: false,
      defaultValue: 1,
      description: 'Page number to retrieve (1-10)',
    }),
  },
  async run({ auth, propsValue }) {
    const client = new FireberryClient(auth.secret_text);
    const { objectType, searchQuery, sortBy, sortOrder, pageSize, pageNumber } = propsValue;
    const selectedFields = Object.entries(propsValue.fieldsToReturn ?? {})
      .filter(([, isSelected]) => isSelected === true)
      .map(([fieldName]) => fieldName);
    const objectTypeNumber = await client.resolveObjectTypeNumber(objectType);
    const queryBody = fireberryUtils.buildQueryBody({
      objectType: objectTypeNumber,
      fields: selectedFields,
      query: searchQuery,
      sortBy,
      sortType: sortOrder,
      pageSize,
      pageNumber,
    });
    const result = await client.query(queryBody);
    return {
      success: true,
      query: queryBody,
      results: {
        objectName: result.ObjectName,
        systemName: result.SystemName,
        objectType: result.ObjectType,
        pageNumber: result.PageNum,
        sortBy: result.SortBy,
        sortDescending: result.SortBy_Desc,
        isLastPage: result.IsLastPage,
        primaryKey: result.PrimaryKey,
        primaryField: result.PrimaryField,
        columns: result.Columns,
        records: result.Data,
        recordCount: result.Data.length,
      },
    };
  },
});
