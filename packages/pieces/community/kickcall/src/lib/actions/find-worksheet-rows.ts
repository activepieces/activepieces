import { createAction, Property } from '@activepieces/pieces-framework';
import { kickcallAuth } from '../auth';
import { kickcallNumbers } from '../common/numbers';
import {
  agentIdDropdown,
  locationIdDropdown,
  worksheetColumnDropdown,
  worksheetIdDropdown,
} from '../common/props';
import { kickcallWorksheets } from '../common/worksheets';

export const findWorksheetRowsAction = createAction({
  auth: kickcallAuth,
  name: 'find_worksheet_rows',
  displayName: 'Find Worksheet Rows',
  description: 'Returns worksheet rows matching a column search value.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Kickcall worksheet rows by column value. Output values are keyed by stable column id with column_names for labels. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    location_id: locationIdDropdown,
    agent_id: agentIdDropdown,
    worksheet_id: worksheetIdDropdown,
    column_id: worksheetColumnDropdown,
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description:
        'Value to search for in the selected column. Leave empty to return rows up to the limit.',
      required: false,
    }),
    match_type: Property.StaticDropdown({
      displayName: 'Match Type',
      required: true,
      defaultValue: 'cont',
      options: {
        options: [
          { label: 'Contains', value: 'cont' },
          { label: 'Exact', value: 'eq' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'Maximum number of matching rows to return (1-1000). Defaults to 1.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = kickcallNumbers.parsePositiveInteger({
      value: propsValue.limit,
      fallback: 1,
      fieldName: 'Limit',
      maximum: 1000,
    });
    const matchType = propsValue.match_type;
    if (matchType !== 'cont' && matchType !== 'eq') {
      throw new Error('Match type must be Contains or Exact');
    }
    return kickcallWorksheets.findWorksheetRows({
      auth,
      locationId: propsValue.location_id,
      agentId: propsValue.agent_id,
      worksheetId: propsValue.worksheet_id,
      columnId: propsValue.column_id,
      searchValue: propsValue.search_value,
      matchType,
      limit,
    });
  },
});
