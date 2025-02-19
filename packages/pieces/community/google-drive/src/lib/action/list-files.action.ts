import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { googleDriveAuth } from '../../index';
import { Property, createAction } from "@activepieces/pieces-framework";
import querystring from 'querystring';

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
    includeTrashed: Property.Checkbox({
      displayName: 'Include Trashed',
      description: 'Include new files that have been trashed.',
      required: false,
      defaultValue: false
    }),
  },
  async run(context) {
    const result = {
      'type': 'drive#fileList',
      'incompleteSearch': false,
      'files': [] as unknown[],
    }

    let q = `'${context.propsValue.folderId}' in parents`;

    // When include_trashed is false, we add a filter to exclude trashed files.
    // By default, Google Drive API returns trashed files as well.
    if (!context.propsValue.includeTrashed) {
      q += ' and trashed=false';
    }

    const params: Record<string, string> = {
      q: q,
      fields: 'files(id,kind,mimeType,name,trashed)',
    }

    let response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://www.googleapis.com/drive/v3/files?${querystring.stringify(params)}`,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
      },
    });

    result.files = [...response.body.files];
    while(response.body.nextPageToken)
    {
      params.pageToken = response.body.nextPageToken;
      response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://www.googleapis.com/drive/v3/files?${querystring.stringify(params)}`,
        headers: {
          Authorization: `Bearer ${context.auth.access_token}`,
        },
      });
      result.files.push(...response.body.files);
      result.incompleteSearch = result.incompleteSearch || response.body.incompleteSearch;
    }
    return result;
  }
});
