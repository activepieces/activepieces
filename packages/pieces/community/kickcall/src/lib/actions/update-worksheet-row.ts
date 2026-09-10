import { createAction, Property } from '@activepieces/pieces-framework';
import { kickcallAuth } from '../auth';
import {
  agentIdDropdown,
  locationIdDropdown,
  worksheetIdDropdown,
  worksheetRowUpdateValuesProp,
} from '../common/props';
import { kickcallWorksheets } from '../common/worksheets';

function toPartialRowValues(values: unknown): Record<string, string> {
  if (typeof values !== 'object' || values === null || Array.isArray(values)) {
    throw new Error('Values must be an object of column fields');
  }
  const typedValues: Record<string, string> = {};
  for (const [columnId, value] of Object.entries(values)) {
    if (value === undefined || value === null) {
      continue;
    }
    const text = String(value);
    if (text.trim().length === 0) {
      continue;
    }
    typedValues[columnId] = text;
  }
  return typedValues;
}

export const updateWorksheetRowAction = createAction({
  auth: kickcallAuth,
  name: 'update_worksheet_row',
  displayName: 'Update Worksheet Row',
  description: 'Updates column values on an existing worksheet row.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates column values on an existing Kickcall worksheet row by row id. Only provided fields are changed. Safe to retry with the same values.',
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
  },
  async run({ auth, propsValue }) {
    return kickcallWorksheets.updateWorksheetRow({
      auth,
      locationId: propsValue.location_id,
      agentId: propsValue.agent_id,
      worksheetId: propsValue.worksheet_id,
      rowId: propsValue.row_id,
      values: toPartialRowValues(propsValue.values),
    });
  },
});
