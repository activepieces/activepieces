import { googleDocsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { folderIdProp } from '../common/props';

export const findDocumentAction = createAction({
  auth: googleDocsAuth,
  name: 'google-docs-find-document',
  displayName: 'Find Document',
  description: 'Search for document by name.',
  props: {
    name: Property.ShortText({
      displayName: 'Document Name',
      required: true,
    }),
    folderId:folderIdProp,
  },
  async run(context) {
    const documentName = context.propsValue.name;

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const drive = google.drive({ version: 'v3', auth: authClient });

    const q :string[] = [`name contains '${documentName}'`,'mimeType="application/vnd.google-apps.document"'];

    if(context.propsValue.folderId) {
      q.push(`'${context.propsValue.folderId}' in parents`);
    }

    const response = await drive.files.list({
      q: q.join(' and '),
      supportsAllDrives: true,
      fields: '*',
    });

    return response.data;
  },
});
