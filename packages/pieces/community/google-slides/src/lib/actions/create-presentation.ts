import { createAction, Property } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { createGoogleClient, googleSlidesAuth } from '../auth';
import { PRESENTATION_MIME_TYPE, slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { createPresentationOutputSchema } from '../output-schemas';

export const createPresentation = createAction({
  auth: googleSlidesAuth,
  name: 'create_presentation',
  classification: 'WRITE',
  displayName: 'Create Presentation',
  description: 'Create a new, empty Google Slides presentation, optionally in a Drive folder.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new, empty Google Slides presentation with the given title, in My Drive or in a chosen Drive folder. Use it to start a deck from scratch, then add content with Add Slide, Insert Image and Replace Text; to start from an existing deck use Copy Presentation or Generate from Template instead. A service account has no Drive storage of its own, so it needs a folder in a Shared Drive. Not idempotent: each call creates another presentation.',
    idempotent: false,
  },
  outputSchema: createPresentationOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Name of the new presentation, e.g. "Q3 Business Review".',
      required: true,
    }),
    folder_id: slidesProps.folderIdProp(
      'Optional Drive folder: its ID or URL (https://drive.google.com/drive/folders/<id>). Leave empty for My Drive. A service account needs a folder in a Shared Drive here.'
    ),
  },
  async run(context) {
    const title = context.propsValue.title?.trim();
    if (!title) {
      throw new Error('Title is required.');
    }
    const folderId = slidesIds.parseFolderId(context.propsValue.folder_id);
    const drive = googleDrive({ version: 'v3', auth: await createGoogleClient(context.auth) });
    const response = await drive.files
      .create({
        requestBody: {
          name: title,
          mimeType: PRESENTATION_MIME_TYPE,
          ...(folderId ? { parents: [folderId] } : {}),
        },
        supportsAllDrives: true,
        fields: 'id,name,createdTime',
      })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action: 'create the presentation' });
      });
    const id = response.data.id;
    if (!id) {
      throw new Error('Google Drive created the presentation but returned no file ID.');
    }
    return {
      presentationId: id,
      title: response.data.name ?? title,
      presentationUrl: slidesApi.presentationUrl(id),
      folderId: folderId ?? null,
      createdTime: response.data.createdTime ?? null,
    };
  },
});
