import { createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { googleDocsAuth, createGoogleClient } from '../auth';
import { docsCommon, flattenDoc, moveFileToFolder } from '../common';
import { folderIdProp } from '../common/props';

export const createDocument = createAction({
  auth: googleDocsAuth,
  name: 'create_document',
  description: 'Create a new Google Doc with an optional body and folder destination.',
  displayName: 'Create Document',
  props: {
    title: docsCommon.title,
    body: docsCommon.body,
    folderId: folderIdProp(
      'Folder',
      'Place the new document inside this folder. Leave empty to use My Drive.',
    ),
  },
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const docs = google.docs({ version: 'v1', auth: authClient });
    const drive = google.drive({ version: 'v3', auth: authClient });

    const created = await docs.documents.create({
      requestBody: { title: context.propsValue.title },
    });

    const documentId = created.data.documentId;
    if (!documentId) {
      throw new Error('Failed to create document: no documentId returned.');
    }

    if (context.propsValue.body) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                text: context.propsValue.body,
                endOfSegmentLocation: {},
              },
            },
          ],
        },
      });
    }

    if (context.propsValue.folderId) {
      await moveFileToFolder({ drive, fileId: documentId, folderId: context.propsValue.folderId });
    }

    const finalDoc = await docs.documents.get({ documentId });
    return flattenDoc(finalDoc.data);
  },
});
