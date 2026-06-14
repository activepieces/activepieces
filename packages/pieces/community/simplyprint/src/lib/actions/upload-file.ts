import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintFiles } from '../common/files';

/**
 * Upload a file (G-code, STL, 3MF) into SimplyPrint via the API files
 * service (files.simplyprint.io). Returns a string file id (hex bucket
 * hash) that can be used as `fileId` on Add File to Queue or `file_id` on
 * Start Print.
 *
 * Two input modes, pick one:
 *   - File: AP's Property.File materializes the source into a Buffer
 *     before the action runs (non-streaming; full file in RAM during
 *     upload). Fine for builder-picked files and step-to-step handoffs.
 *   - File URL: the piece fetches and streams the bytes directly to
 *     SimplyPrint with ~95 MiB peak memory regardless of source size.
 *     Use for multi-hundred-MB / GB slicer files from cloud storage.
 *
 * Files over 95 MiB are sent in chunks via the `totalSize` +
 * `continueToken` protocol, on either path.
 */
export const uploadFileAction = createAction({
  auth: simplyprintAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description:
    'Upload a file or HTTPS URL to SimplyPrint. URL uploads stream with ~95 MiB peak RAM; File uploads are buffered by AP. Files over 95 MiB are chunked automatically. Returns the API file id — pass it to "Add File to Queue" or "Start Print" later.',
  audience: 'both',
  aiMetadata: { description: 'Upload a print file (G-code, STL, 3MF) to SimplyPrint, supplied either as a File input or as an HTTPS URL to stream from; the filename extension must be correct since the backend infers type from it. Use this when you only need the file staged for later; to queue or print in one step use the dedicated upload-and-queue or upload-to-folder tools. Not idempotent — each call creates a new uploaded file.', idempotent: false },
  props: {
    file: Property.File({
      displayName: 'File',
      description:
        'File data (G-code, STL, 3MF). Used if "File URL" is empty. AP materializes the whole file into RAM before this action runs — for very large files prefer the File URL input below.',
      required: false,
    }),
    fileUrl: Property.ShortText({
      displayName: 'File URL',
      description:
        'Alternative to File — an HTTPS URL the piece will stream directly to SimplyPrint without buffering the whole file in memory. Recommended for files over ~500 MB. The URL must return a Content-Length header (S3 pre-signed URLs, Dropbox raw links, signed Google Drive download URLs, etc.). If set, the File input is ignored.',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description:
        'Name to store the file under on SimplyPrint. MUST include the correct extension (e.g. .gcode, .stl, .3mf) — the backend picks the file type from the extension, not the contents. Required when using File URL unless the URL path ends in a filename with an extension. Optional with File (defaults to source filename).',
      required: false,
    }),
  },
  async run(context) {
    const fileProp = context.propsValue.file;
    const rawUrl = context.propsValue.fileUrl?.trim();
    const customName = context.propsValue.filename?.trim();

    if (!rawUrl && !fileProp) {
      throw new Error('Provide either File or File URL.');
    }

    if (rawUrl) {
      const filename = customName && customName.length > 0
        ? customName
        : simplyprintFiles.filenameFromUrl(rawUrl);
      if (!filename) {
        throw new Error(
          'Filename is required when uploading from File URL — the URL path has no recognizable filename with an extension. Set the Filename field explicitly (e.g. "my-print.gcode").',
        );
      }
      const { fileId, name, size, expiresAt, raw } = await simplyprintFiles.uploadUserFileFromUrl({
        auth: context.auth,
        url: rawUrl,
        filename,
      });
      return { fileId, name, size, expiresAt, raw };
    }

    const filename = customName && customName.length > 0 ? customName : fileProp!.filename;
    const { fileId, name, size, expiresAt, raw } = await simplyprintFiles.uploadUserFile({
      auth: context.auth,
      file: { filename, data: fileProp!.data },
    });
    return { fileId, name, size, expiresAt, raw };
  },
});
