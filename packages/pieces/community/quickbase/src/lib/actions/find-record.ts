import { createAction } from '@activepieces/pieces-framework';
import { quickbaseAuth } from '../../index';
import { appIdProp, tableIdProp, filtersProp, maxRecordsProp, sortFieldProp, sortOrderProp } from '../common/props';
import { QuickbaseClient } from '../common/client';
import { QuickbaseRecordResponse, QuickbaseField } from '../common/types';
import { buildWhereClause, extractRecordValues } from '../common/utils';

export const findRecord = createAction({
  name: 'find_record',
  displayName: 'Find Record',
  description: 'Search for records in a Quickbase table using filters',
  auth: quickbaseAuth,
  props: {
    appId: appIdProp,
    tableId: tableIdProp,
    filters: filtersProp,
    sortField: sortFieldProp,
    sortOrder: sortOrderProp,
    maxRecords: maxRecordsProp,
  },
  async run(context) {
    const { appId, tableId, filters, sortField, sortOrder, maxRecords } = context.propsValue;
    const client = new QuickbaseClient(context.auth.props.realmHostname, context.auth.props.userToken);

    const tableFields = await client.get<QuickbaseField[]>(`/fields?tableId=${tableId}`);
    const whereClause = filters ? buildWhereClause(filters) : '';

    const query: any = {
      from: tableId,
      select: tableFields.map(f => f.id),
      where: whereClause,
      options: {
        top: maxRecords || 100,
      },
    };

    if (sortField) {
      query.sortBy = [{
        fieldId: parseInt(sortField),
        order: sortOrder || 'ASC',
      }];
    }

    const response = await client.post<QuickbaseRecordResponse>('/records/query', query);

    const records = response.data.map(record => ({
      id: record['3']?.value,
      displayName: record['3']?.value,
      raw: extractRecordValues(record),
    }));

    return {
      records,
      totalRecords: response.metadata.totalRecords,
      success: true,
    };
  },
});