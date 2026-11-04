import { createAction } from '@activepieces/pieces-framework';
import { kickcallAuth } from '../auth';
import {
  agentIdDropdown,
  locationIdDropdown,
  worksheetIdDropdown,
  worksheetRowValuesProp,
} from '../common/props';
import { kickcallWorksheets } from '../common/worksheets';

export const addWorksheetRowAction = createAction({
  auth: kickcallAuth,
  name: 'add_worksheet_row',
  displayName: 'Add Worksheet Row',
  description: 'Returns the created worksheet row with column values.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new row in a Kickcall worksheet with the provided column values. Not idempotent.',
    idempotent: false,
  },
  props: {
    location_id: locationIdDropdown,
    agent_id: agentIdDropdown,
    worksheet_id: worksheetIdDropdown,
    values: worksheetRowValuesProp,
  },
  async run({ auth, propsValue }) {
    return kickcallWorksheets.addWorksheetRow({
      auth,
      locationId: propsValue.location_id,
      agentId: propsValue.agent_id,
      worksheetId: propsValue.worksheet_id,
      values: toRowValues(propsValue.values),
    });
  },
});

function toRowValues(values: unknown): Record<string, string> {
  if (typeof values !== 'object' || values === null || Array.isArray(values)) {
    throw new Error('Values must be an object of column fields');
  }
  const typedValues: Record<string, string> = {};
  for (const [columnId, value] of Object.entries(values)) {
    if (value === undefined || value === null) {
      continue;
    }
    typedValues[columnId] = String(value);
  }
  return typedValues;
}
