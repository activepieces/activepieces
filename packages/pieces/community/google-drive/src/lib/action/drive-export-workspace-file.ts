import { createAction, Property } from '@activepieces/pieces-framework';
import { googleDriveAuth, createGoogleClient } from '../auth';
import { drive as googleDrive } from '@googleapis/drive';
import { extension } from 'mime-types';

export const driveExportWorkspaceFile = createAction({
  auth: googleDriveAuth,
  name: 'drive_export_workspace_file',
  displayName: 'Export Google Doc/Sheet/Slides',
  description:
    'Export a native Google Workspace file (Doc/Sheet/Slides) to a chosen format.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Exports a native Google Workspace file (Doc/Sheet/Slides) to a caller-chosen format and returns the bytes. Use when you need a specific format such as PDF, HTML, CSV, or Markdown; for the default rendition or for ordinary binary files use `drive_download_file`. The chosen format must match the source type (Doc formats for a Doc, Sheet formats for a Sheet, etc.). Read-only. Export size is capped at ~10 MB by Drive.',
    idempotent: true,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The ID of the native Google Workspace file to export. Resolve it via `drive_search_files` or `drive_get_file`.',
      required: true,
    }),
    mime_type: Property.StaticDropdown({
      displayName: 'Export Format',
      description:
        'The target format. It must match the source type: Doc formats for a Google Doc, Sheet formats for a Google Sheet, Slides formats for Google Slides. An incompatible pairing returns an error.',
      required: true,
      options: {
        options: [
          // Google Docs
          {
            label: 'Word (DOCX) — Docs',
            value:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
          { label: 'PDF — Docs/Sheets/Slides', value: 'application/pdf' },
          { label: 'HTML — Docs', value: 'text/html' },
          { label: 'Plain Text (TXT) — Docs', value: 'text/plain' },
          { label: 'Rich Text (RTF) — Docs', value: 'application/rtf' },
          {
            label: 'OpenDocument Text (ODT) — Docs',
            value: 'application/vnd.oasis.opendocument.text',
          },
          { label: 'EPUB — Docs', value: 'application/epub+zip' },
          { label: 'Markdown (MD) — Docs', value: 'text/markdown' },
          // Google Sheets
          {
            label: 'Excel (XLSX) — Sheets',
            value:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
          { label: 'CSV — Sheets', value: 'text/csv' },
          { label: 'TSV — Sheets', value: 'text/tab-separated-values' },
          {
            label: 'OpenDocument Spreadsheet (ODS) — Sheets',
            value: 'application/vnd.oasis.opendocument.spreadsheet',
          },
          // Google Slides
          {
            label: 'PowerPoint (PPTX) — Slides',
            value:
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          },
          {
            label: 'OpenDocument Presentation (ODP) — Slides',
            value: 'application/vnd.oasis.opendocument.presentation',
          },
          { label: 'PNG — Slides', value: 'image/png' },
          { label: 'SVG — Slides', value: 'image/svg+xml' },
        ],
      },
    }),
  },
  async run(context) {
    const { file_id, mime_type } = context.propsValue;

    const authClient = await createGoogleClient(context.auth);
    const drive = googleDrive({ version: 'v3', auth: authClient });

    try {
      const result = await drive.files.export(
        {
          fileId: file_id,
          mimeType: mime_type,
        },
        {
          responseType: 'arraybuffer',
        }
      );

      const extensionResult = extension(mime_type);
      const fileExtension = extensionResult ? '.' + extensionResult : '';

      return context.files.write({
        fileName: file_id + fileExtension,
        data: Buffer.from(result.data as any),
      });
    } catch (error: any) {
      // exportSizeLimitExceeded is a 403 but distinct from a permission denial.
      const reason =
        error?.errors?.[0]?.reason ?? error?.response?.data?.error?.errors?.[0]?.reason;
      if (reason === 'exportSizeLimitExceeded') {
        throw new Error(
          `Export failed: the file exceeds Drive's ~10 MB export size limit (file ID: ${file_id}). Use drive_download_file to fetch the source directly instead.`
        );
      }
      if (error.code === 403) {
        throw new Error(
          `Permission denied exporting file ${file_id}. You may lack access to this file.`
        );
      }
      if (error.code === 400) {
        throw new Error(
          `Invalid export for file ${file_id}: the chosen format does not match the source type, or this is not a native Google Workspace file. Use drive_download_file for ordinary binary files.`
        );
      }
      if (error.code === 404) {
        throw new Error(
          `File not found (ID: ${file_id}). Resolve a valid ID via drive_search_files or drive_get_file.`
        );
      }
      throw error;
    }
  },
});
