import { createAction, Property } from '@activepieces/pieces-framework';
import { drive as googleDrive } from '@googleapis/drive';
import { createGoogleClient, googleSlidesAuth } from '../auth';
import { slidesApi } from '../commons/common';
import { slidesIds } from '../commons/ids';
import { slidesProps } from '../commons/props';
import { EXPORT_FORMATS, slidesRequests } from '../commons/requests';
import { exportPresentationOutputSchema } from '../output-schemas';

export const exportPresentation = createAction({
  auth: googleSlidesAuth,
  name: 'export_presentation',
  classification: 'READ',
  displayName: 'Export Presentation',
  description: 'Download a presentation as a PDF, PowerPoint, OpenDocument or plain-text file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Export a Google Slides presentation through Google Drive as a PDF, PowerPoint (.pptx), OpenDocument (.odp) or plain-text file and return it as a file for later steps (email attachment, upload). Use it to share or archive a deck outside Google; to read slide text for reasoning prefer Get Presentation Outline. Drive refuses exports above 10 MB. Read-only and idempotent: repeating the call exports the same content.',
    idempotent: true,
  },
  outputSchema: exportPresentationOutputSchema,
  props: {
    presentation_id: slidesProps.presentationIdProp(),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'File format of the export.',
      required: true,
      defaultValue: 'pdf',
      options: {
        options: [
          { label: 'PDF (.pdf)', value: 'pdf' },
          { label: 'PowerPoint (.pptx)', value: 'pptx' },
          { label: 'OpenDocument (.odp)', value: 'odp' },
          { label: 'Plain text (.txt)', value: 'txt' },
        ],
      },
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'Name of the exported file without extension. Leave empty to use the presentation name.',
      required: false,
    }),
  },
  async run(context) {
    const presentationId = slidesIds.parsePresentationId(context.propsValue.presentation_id);
    const format = EXPORT_FORMATS[context.propsValue.format ?? 'pdf'];
    if (!format) {
      throw new Error(`Format must be one of: ${Object.keys(EXPORT_FORMATS).join(', ')}.`);
    }
    const drive = googleDrive({ version: 'v3', auth: await createGoogleClient(context.auth) });
    const action = 'export the presentation';
    const requestedName = context.propsValue.file_name?.trim();
    const baseName =
      requestedName ||
      (await drive.files
        .get({ fileId: presentationId, fields: 'name', supportsAllDrives: true })
        .then((meta) => meta.data.name ?? presentationId)
        .catch((error: unknown) => {
          throw slidesApi.googleApiError({ error, action });
        }));
    const response = await drive.files
      .export({ fileId: presentationId, mimeType: format.mimeType }, { responseType: 'arraybuffer' })
      .catch((error: unknown) => {
        throw slidesApi.googleApiError({ error, action });
      });
    const data = toBuffer(response.data);
    const fileName = slidesRequests.exportFileName({ baseName, extension: format.extension });
    const file = await context.files.write({ fileName, data });
    return {
      presentationId,
      fileName,
      mimeType: format.mimeType,
      sizeBytes: data.length,
      file,
    };
  },
});

function toBuffer(data: unknown): Buffer {
  if (Buffer.isBuffer(data)) {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }
  if (ArrayBuffer.isView(data)) {
    return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  }
  if (typeof data === 'string') {
    return Buffer.from(data, 'utf8');
  }
  throw new Error('Google Drive returned the export in an unexpected format, so no file was saved.');
}
