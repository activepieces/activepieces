import { createAction, Property } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamidDropdown, databaseIdDropdown, tableIdDropdown, recordIdDropdown, updateDynamicFields } from '../common/props';

export const updateRecord = createAction({
  auth: NinoxAuth,
  name: 'updateRecord',
  displayName: 'Update Record',
  description: 'Update fields on an existing record (e.g., update status after processing).',
  props: {
    teamid: teamidDropdown,
    dbid: databaseIdDropdown,
    tid: tableIdDropdown,
    rid: recordIdDropdown,
    fields: updateDynamicFields,
  },
  async run({ auth, propsValue }) {
    const { teamid, dbid, tid, rid, fields } = propsValue;

    const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/records/${rid}`;

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.PUT,
        path,
        { fields }
      );

      return {
        success: true,
        message: 'Record updated successfully',
        response: response,
        updatedFields: fields,
        recordId: rid
      };
    } catch (error) {
      throw new Error(`Failed to update record: ${error}`);
    }
  },
});
