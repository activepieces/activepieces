import { createAction, Property } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { databaseIdDropdown, recordIdDropdown, tableIdDropdown, teamidDropdown } from '../common/props';

export const updateRecord = createAction({
  auth: NinoxAuth,
  name: 'updateRecord',
  displayName: 'Update Record',
  description: 'Update fields on an existing record (e.g., update status after processing).',
  props: {
    teamid: teamidDropdown,
    dbid: databaseIdDropdown,
    tid:tableIdDropdown,
    recordId: recordIdDropdown,
    updateData: Property.Json({
      displayName: 'Update Data',
      description: 'The data to update the record with (JSON object with field names as keys)',
      required: true,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    const { teamid, dbid, tid, recordId, updateData } = propsValue;
    
    const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/records/${recordId}`;
    
    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.PUT,
        path,
        updateData
      );
      
      return response;
    } catch (error) {
      throw new Error(`Failed to update record: ${error}`);
    }
  },
});
