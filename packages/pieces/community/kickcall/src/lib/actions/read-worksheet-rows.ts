import { createAction } from '@activepieces/pieces-framework';
import { kickcallAuth } from '../auth';
import {
  agentIdDropdown,
  locationIdDropdown,
  worksheetIdDropdown,
} from '../common/props';
import { kickcallWorksheets } from '../common/worksheets';

export const readWorksheetRowsAction = createAction({
  auth: kickcallAuth,
  name: 'read_worksheet_rows',
  displayName: 'Read Worksheet Rows',
  description:
    'Returns worksheet rows as id, position, values keyed by column id, and column_names.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all rows in a Kickcall worksheet. values is keyed by stable column id; column_names maps those ids to display names. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    location_id: locationIdDropdown,
    agent_id: agentIdDropdown,
    worksheet_id: worksheetIdDropdown,
  },
  async run({ auth, propsValue }) {
    return kickcallWorksheets.listWorksheetRows({
      auth,
      locationId: propsValue.location_id,
      agentId: propsValue.agent_id,
      worksheetId: propsValue.worksheet_id,
    });
  },
});
