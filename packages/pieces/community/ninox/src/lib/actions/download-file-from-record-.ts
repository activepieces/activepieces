import { createAction, Property } from '@activepieces/pieces-framework';
import { NinoxAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamidDropdown, databaseIdDropdown, tableIdDropdown, recordIdDropdown, filenameDropdown } from '../common/props';


export const downloadFileFromRecord = createAction({
  auth: NinoxAuth,
  name: 'downloadFileFromRecord',
  displayName: 'Download File from Record',
  description: 'Download a file attached to a record for processing or storage.',
  props: {
    teamid: teamidDropdown,
    dbid: databaseIdDropdown,
    tid: tableIdDropdown,
    rid: recordIdDropdown,
    file: filenameDropdown,
  },
  async run({ auth, propsValue }) {
      const { teamid, dbid, tid, rid, file  } = propsValue;

    const path = `/teams/${teamid}/databases/${dbid}/tables/${tid}/records/${rid}/files/${file}`;

    try {
      const response = await makeRequest(auth, HttpMethod.GET, path)


      // Safely extract headers with proper type handling
      const contentType = response.headers?.['content-type'];
      const contentLength = response.headers?.['content-length'];

      const contentTypeValue = Array.isArray(contentType) ? contentType[0] : contentType;
      const contentLengthValue = Array.isArray(contentLength) ? contentLength[0] : contentLength;

      // Return the file data as a downloadable file
      return {
        success: true,
        message: 'File downloaded successfully',
        fileName: file,
        fileData: response.body,
        contentType: contentTypeValue || 'application/octet-stream',
        size: contentLengthValue ? parseInt(contentLengthValue) : undefined,
      };
    } catch (error) {
      throw new Error(`Failed to download file: ${error}`);
    }
  },
});


