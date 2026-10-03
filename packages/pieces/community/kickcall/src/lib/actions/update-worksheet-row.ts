import { createAction, Property } from '@activepieces/pieces-framework';
import { kickcallAuth } from '../auth';
import {
  agentIdDropdown,
  locationIdDropdown,
  worksheetColumnsToClearProp,
  worksheetIdDropdown,
  worksheetRowUpdateValuesProp,
} from '../common/props';
import { kickcallRowValues } from '../common/row-values';
import { kickcallWorksheets } from '../common/worksheets';

export const updateWorksheetRowAction = createAction({
  auth: kickcallAuth,
  name: 'update_worksheet_row',
  displayName: 'Update Worksheet Row',
  description: 'Updates column values on an existing worksheet row.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates column values on an existing Kickcall worksheet row by row id. Only provided values change; use Columns to Clear to empty cells. Safe to retry with the same values.',
    idempotent: true,
  },
  props: {
    location_id: locationIdDropdown,
    agent_id: agentIdDropdown,
    worksheet_id: worksheetIdDropdown,
    row_id: Property.ShortText({
      displayName: 'Row ID',
      description:
        'Worksheet row id from Read Worksheet Rows or Find Worksheet Rows output.',
      required: true,
    }),
    values: worksheetRowUpdateValuesProp,
    clear_column_ids: worksheetColumnsToClearProp,
  },
  async run({ auth, propsValue }) {
    return kickcallWorksheets.updateWorksheetRow({
      auth,
      locationId: propsValue.location_id,
      agentId: propsValue.agent_id,
      worksheetId: propsValue.worksheet_id,
      rowId: propsValue.row_id,
      values: kickcallRowValues.applyClearedColumns({
        values: kickcallRowValues.toPartialRowValues(propsValue.values),
        columnIds: propsValue.clear_column_ids,
      }),
    });
  },
});
