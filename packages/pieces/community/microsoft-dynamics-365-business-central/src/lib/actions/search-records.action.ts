import { businessCentralAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { commonProps } from '../common';
import { makeClient } from '../common/client';
import { TRIGGER_ENTITY_DROPDOWN_OPTIONS } from '../common/constants';

export const searchRecordsAction = createAction({
  auth: businessCentralAuth,
  name: 'search-records',
  displayName: 'Search Records',
  description: 'Retrieves a list of records.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists records of a chosen entity type from a Microsoft Dynamics 365 Business Central company. Optionally filters by exact, case-sensitive matches on one or more property fields (all conditions are AND-ed); leave the filter fields empty to return all records of that type. Use to find records when you do not have a specific id. Read-only and idempotent.',
    idempotent: true,
  },
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
