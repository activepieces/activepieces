import { createAction, Property } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { createGoogleClient, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { copyPresentationOutputSchema } from '../output-schemas';

export const copyPresentation = createAction({
  auth: googleSlidesAuth,
  name: 'copy_presentation',
  classification: 'WRITE',
  displayName: 'Copy Presentation',
  description: 'Make a copy of a presentation, optionally with a new name and folder.',
  audience: 'both',
  aiMetadata: {
    description:
      'Duplicate an existing Google Slides presentation as a new file, with an optional new name and Drive folder; the content is copied unchanged. Use it to work on a copy of a deck (then Replace Text, Add Slide, etc. on the copy); for one-step copy-and-fill of {{placeholders}} use Generate from Template. A service account needs a Shared Drive folder. Not idempotent: each call creates another file.',
    idempotent: false,
  },
  outputSchema: copyPresentationOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp('Presentation to Copy'),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'Name of the copy. Leave empty for Google\'s default ("Copy of <name>").',
      required: false,
    }),
    folder_id: slidesProps.folderIdProp(
      'Optional Drive folder for the copy: its ID or URL (https://drive.google.com/drive/folders/<id>). Leave empty to use the default location. A service account needs a folder in a Shared Drive here.'
    ),
  },
  async run(context) {
    const sourceId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const folderId = slidesIds.parseFolderId(context.propsValue.folder_id);
    const name = context.propsValue.name?.trim();
    const drive = googleDrive({ version: 'v3', auth: await createGoogleClient(context.auth) });
    const response = await drive.files
      .copy({
        fileId: sourceId,
        requestBody: {
          ...(name ? { name } : {}),
          ...(folderId ? { parents: [folderId] } : {}),
        },
        supportsAllDrives: true,
        fields: 'id,name,createdTime',
      })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action: 'copy the presentation' });
      });
    const id = response.data.id;
    if (!id) {
      throw new Error('Google Drive copied the presentation but returned no file ID.');
    }
    return {
      presentationId: id,
      title: response.data.name ?? null,
      presentationUrl: slidesApi.presentationUrl(id),
      sourcePresentationId: sourceId,
      folderId: folderId ?? null,
      createdTime: response.data.createdTime ?? null,
    };
  },
});
