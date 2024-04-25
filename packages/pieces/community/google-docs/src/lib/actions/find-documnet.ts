import { googleDocsAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

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
  },
  async run(context) {
    const documentName = context.propsValue.name;

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const drive = google.drive({ version: 'v3', auth: authClient });

    const response = await drive.files.list({
      q: `name contains '${documentName}' and mimeType='application/vnd.google-apps.document'`,
      supportsAllDrives: true,
      fields: '*',
    });

    return response.data;
  },
});
