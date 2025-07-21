import { createAction } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamidDropdown, databaseIdDropdown, tableIdDropdown, recordIdDropdown } from '../common/props';

export const listFilesFromRecord = createAction({
  auth: NinoxAuth,
  name: 'listFilesFromRecord',
  displayName: 'List Files from Record',
  description: 'List files attached to a specific record (without downloading) for management.',
  props: {
    teamid: teamidDropdown,
    dbid: databaseIdDropdown,
    tid: tableIdDropdown,
    rid: recordIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { teamid, dbid, tid, rid } = propsValue;

    const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/records/${rid}/files`;

    try {
      const response = await makeRequest<any>(
        auth as string,
        HttpMethod.GET,
        path
      );

      // Process the file metadata
      const files = Array.isArray(response) ? response : [];

      return {
        success: true,
        message: `Found ${files.length} file(s) attached to the record`,
        files: files,
        totalFiles: files.length,
        recordId: rid,
      };
    } catch (error) {
      throw new Error(`Failed to list files from record: ${error}`);
    }
  },
});

