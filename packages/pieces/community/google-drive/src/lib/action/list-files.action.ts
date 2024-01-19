import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { googleDriveAuth } from '../../index';
import { Property, createAction } from "@activepieces/pieces-framework";

export const googleDriveListFiles = createAction({
  auth: googleDriveAuth,
  name: 'list-files',
  displayName: 'List files',
  description: 'List files from a Google Drive folder',
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description: 'Folder ID coming from | New Folder -> id | (or any other source)',
      required: true,
    }),
  },
  async run(context) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/drive/v3/files?q='${context.propsValue.folderId}'+in+parents`,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
      },
    });

    return response.body;
  }
});