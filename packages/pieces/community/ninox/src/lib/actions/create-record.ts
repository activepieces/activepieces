import { createAction, Property } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamidDropdown, databaseIdDropdown, tableIdDropdown } from '../common/props';

export const createRecord = createAction({
  auth: NinoxAuth,
  name: 'createRecord',
  displayName: 'Create Record',
  description: 'Insert a new record into a specified table (e.g., add a lead from another form).',
  props: {
    teamid: teamidDropdown,
    dbid: databaseIdDropdown,
    tid: tableIdDropdown,
    recordData: Property.Json({
      displayName: 'Record Data',
      description: 'The data for the new record (JSON object with field names as keys)',
      required: true,
      defaultValue: {},
    }),
  },
  async run({ auth, propsValue }) {
    const { teamid, dbid, tid, recordData } = propsValue;
    
    const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/records`;
    
    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.POST,
        path,
        recordData
      );
      
      return response;
    } catch (error) {
      throw new Error(`Failed to create record: ${error}`);
    }
  },
});
