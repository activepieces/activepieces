import { createAction, Property } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamidDropdown, databaseIdDropdown, tableIdDropdown, recordIdDropdown } from '../common/props';

export const deleteRecord = createAction({
  auth: NinoxAuth,
  name: 'deleteRecord',
  displayName: 'Delete Record',
  description: 'Remove a record from a table (e.g., clear test data).',
  props: {
    teamid: teamidDropdown,
    dbid: databaseIdDropdown,
    tid: tableIdDropdown,
    recordId: recordIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { teamid, dbid, tid, recordId } = propsValue;
    
    const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/records/${recordId}`;
    
    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.DELETE,
        path
      );
      
      return { success: true, message: 'Record deleted successfully'};
    } catch (error) {
      throw new Error(`Failed to delete record: ${error}`);
    }
  },
});
