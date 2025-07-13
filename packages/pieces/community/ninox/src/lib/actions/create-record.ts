import { createAction, Property } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamidDropdown, databaseIdDropdown, tableIdDropdown, createDynamicFields,  } from '../common/props';

export const createRecord = createAction({
  auth: NinoxAuth,
  name: 'createRecord',
  displayName: 'Create Record',
  description: 'Insert a new record into a specified table (e.g., add a lead from another form).',
  props: {
    teamid: teamidDropdown,
    dbid: databaseIdDropdown,
    tid: tableIdDropdown,
   fields: createDynamicFields,
  },
  async run({ auth, propsValue }) {
    const { teamid, dbid, tid, fields } = propsValue;

    const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/records`;
    
    // Filter out empty values and prepare the record data
    const recordData: Record<string, any> = {};
    Object.keys(fields).forEach(key => {
      if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') {
        recordData[key] = fields[key];
      }
    });
    
    const requestBody = {
      _upsert: true,
      fields: recordData
    };

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.POST,
        path,
        requestBody
      );

      return {
        success: true,
        message: 'Record created successfully',
        response: response,
        recordData: recordData
      };
    } catch (error) {
      throw new Error(`Failed to create record: ${error}`);
    }
  },
});
