import { createAction, Property } from '@activepieces/pieces-framework';

import { airtableCommon } from '../common';
import { airtableAuth } from '../../index';

export const airtableFindRecordAction = createAction({
  auth: airtableAuth,
  name: 'airtable_find_record',
  displayName: 'Find Airtable Record',
  description: 'Find a record in airtable',
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
      personalToken,
      baseId: baseId as string,
      tableId: tableId as string,
      searchField: searchField as string,
      searchValue: searchValue as string,
      limitToView: limitToView as string,
    });
  },
});
