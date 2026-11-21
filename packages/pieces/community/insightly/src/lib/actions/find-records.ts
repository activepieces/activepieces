import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyClient, insightlyUtils } from '../common/client';
import { insightlyAuth, insightlyCommon, OBJECT_OPTIONS, podProperty } from '../common/common';
import { outputSchemas } from '../common/output-schemas';
import { searchableFields } from '../common/props';

const MAX_FIND_LIMIT = 500;

export const findRecords = createAction({
  auth: insightlyAuth,
  name: 'find_records',
  classification: 'SEARCH',
  displayName: 'Find Records',
  description: 'Find records in a specified Insightly object where a field exactly matches a value',
  audience: 'human',
  outputSchema: outputSchemas['genericRecordList'],
  props: {
    pod: podProperty(),
    objectName: Property.StaticDropdown({
      displayName: 'Object Type',
      description: 'Select the type of records to find',
      required: true,
      options: { options: OBJECT_OPTIONS },
    }),
    fieldName: Property.Dropdown({
      auth: insightlyAuth,
      displayName: 'Field Name',
      description: 'Select the field to search by. Custom field names (ending in __c) can be mapped as a custom value.',
      required: true,
      refreshers: ['objectName'],
      options: async ({ objectName }) => {
        const options = typeof objectName === 'string' ? searchableFields[objectName] : undefined;
        if (!options) {
          return { disabled: true, placeholder: 'Select an object type first', options: [] };
        }
        return { disabled: false, options };
      },
    }),
    fieldValue: Property.ShortText({
      displayName: 'Field Value',
      description: 'The value to search for (exact match)',
      required: true,
    }),
    top: Property.Number({
      displayName: 'Limit',
      description: `Maximum number of records to return (default and maximum ${MAX_FIND_LIMIT}).`,
      required: false,
    }),
  },
  async run(context) {
    const { pod, fieldName, fieldValue, top } = context.propsValue;
    const objectName = insightlyCommon.ensureObject(context.propsValue.objectName);
    const field = insightlyUtils.optionalText(fieldName);
    if (!field) {
      throw new Error('Select a field to search by.');
    }
    const limit = top === undefined || top === null ? MAX_FIND_LIMIT : Math.min(Math.max(Math.floor(top), 1), MAX_FIND_LIMIT);
    const connection = await insightlyCommon.connect({ auth: context.auth, pod });
    const { records } = await insightlyClient.paginate({
      apiKey: connection.apiKey,
      pod: connection.pod,
      path: `/${objectName}/Search`,
      query: { field_name: field, field_value: fieldValue },
      limit,
    });
    const idKey = insightlyCommon.idKeyFor(objectName);
    return records.map((record) => ({ ...insightlyUtils.sanitizeRecord(record), id: insightlyUtils.readNumber(record[idKey]), objectType: objectName }));
  },
});
