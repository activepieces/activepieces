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
    'Returns worksheet rows as an array of id, position, and column values.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all rows in a Kickcall worksheet with column values keyed by column name. Read-only and idempotent.',
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
