import { businessCentralAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { commonProps } from '../common';
import { makeClient } from '../common/client';
import { TRIGGER_ENTITY_DROPDOWN_OPTIONS } from '../common/constants';

export const searchRecordsAction = createAction({
  auth: businessCentralAuth,
  name: 'search-records',
  displayName: 'Search Records',
  description: 'Retrieves a list of records.',
  props: {
    company_id: commonProps.company_id,
    record_type: Property.StaticDropdown({
      displayName: 'Record Type',
      required: true,
      options: {
        disabled: false,
        options: TRIGGER_ENTITY_DROPDOWN_OPTIONS,
      },
    }),
    markdown: Property.MarkDown({
      value: `You can search on any and all of the property fields below. We'll return only exact matches (capitalization matters!) on all values provided.`,
    }),
    record_filter_fields: commonProps.record_filter_fields,
  },
  async run(context) {
    const companyId = context.propsValue.company_id;
    const recordType = context.propsValue.record_type;
    const recordFilterFields = context.propsValue.record_filter_fields;

    const filterFieldsArray = [];

    for (const key in recordFilterFields) {
      if (recordFilterFields[key]) {
        filterFieldsArray.push(`${key} eq '${recordFilterFields[key]}'`);
      }
    }

    const client = makeClient(context.auth);

    return await client.filterRecords(companyId, recordType, {
      $filter: filterFieldsArray.join(' and '),
    });
  },
});
