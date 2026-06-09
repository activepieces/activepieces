import { createAction, Property } from '@activepieces/pieces-framework';

import { airtableCommon } from '../common';
import { airtableAuth } from '../auth';

export const airtableFindRecordAction = createAction({
  auth: airtableAuth,
  name: 'airtable_find_record',
  displayName: 'Find Airtable Record',
  description: 'Find a record in airtable',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches a table for records whose chosen field contains the given search value, using a substring (FIND) match, and optionally limits the search to a specific view. Use to look up records by a field value when you do not have the record ID. The search field and a non-empty search value are required; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    base: airtableCommon.base,
    tableId: airtableCommon.tableId,
    searchField: airtableCommon.fieldNames,
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      required: true,
    }),
    limitToView: airtableCommon.views,
  },
  async run(context) {
    const personalToken = context.auth;
    const {
      base: baseId,
      tableId,
      searchField,
      searchValue,
      limitToView,
    } = context.propsValue;

    return await airtableCommon.findRecord({
      personalToken: personalToken.secret_text,
      baseId: baseId as string,
      tableId: tableId as string,
      searchField: searchField as string,
      searchValue: searchValue as string,
      limitToView: limitToView as string,
    });
  },
});
