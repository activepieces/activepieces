import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { simplyprintCustomFields } from '../common/custom-fields';
import { simplyprintFiles } from '../common/files';

/**
 * Save a file to the user file system inside a specific folder.
 *
 * Two-step on the wire — OAuth tokens cannot use the multipart/chunkId paths
 * on `files/Upload` (the panel and mobile app do, but `Upload.php::execute`
 * gates `FILES["file"]` / `POST["analysis"]` / `POST["chunkId"]` to
 * `isAppRequest() || isPanelRequest()`). The integration-supported path is:
 *
 *   1. Upload the bytes to the API files service (files.simplyprint.io)
 *      via the existing chunked / streamed protocol → returns hex `fileId`.
 *   2. POST `files/Upload` with `{fileId}` in the body and `folder` in the
 *      query string → backend materializes a UserFile in that folder.
 *
 * Reusing the chunked-upload state machine means files of any size go
 * through (95 MiB chunks single-shot under the cap, streamed above).
 */
export const uploadToFolderAction = createAction({
  auth: simplyprintAuth,
  name: 'upload_to_folder',
  displayName: 'Upload File to Folder',
  description:
    'Upload a file (or HTTPS URL) and save it to your SimplyPrint user file system, optionally inside a specific folder. URL uploads stream with ~95 MiB peak RAM; File uploads are buffered by AP. Files over 95 MiB are chunked automatically.',
  audience: 'both',
  aiMetadata: { description: 'Upload a print file (File input or HTTPS URL) and save it as a persistent user-file inside a chosen folder of the SimplyPrint file system, returning a user-file UID. Pick this over plain upload-file when the file should live in the library/folders; pick upload-and-queue instead when the goal is to print it. Not idempotent — each call creates a new user-file.', idempotent: false },
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
        'Alternative to File — an HTTPS URL the piece will stream directly to SimplyPrint without buffering the whole file in memory. Recommended for files over ~500 MB. The URL must return a Content-Length header (S3 pre-signed URLs, Dropbox raw links, etc.). If set, the File input is ignored.',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description:
        'Name to store the file under on SimplyPrint. MUST include the correct extension (e.g. .gcode, .stl, .3mf) — the backend picks the file type from the extension, not the contents. Required when using File URL unless the URL path ends in a filename with an extension. Optional with File (defaults to source filename).',
      required: false,
    }),
    folderId: Property.Number({
      displayName: 'Folder ID',
      description:
        'Numeric ID of the destination folder. Use 0 (or leave empty) to save to the root of the user file system. Look up folder IDs with the "List Files" action.',
      required: false,
      defaultValue: 0,
    }),
    customFields: Property.Object({
      displayName: 'Custom fields',
      description:
        'Optional. Object keyed by custom-field UUID (fieldId) → value. PRINT category / USER_FILE sub-category is auto-applied.',
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

    // Step 1: stage the bytes via files.simplyprint.io to get a hex fileId.
    const uploadResult = await (async () => {
      if (rawUrl) {
        const filename = customName && customName.length > 0
          ? customName
          : simplyprintFiles.filenameFromUrl(rawUrl);
        if (!filename) {
          throw new Error(
            'Filename is required when uploading from File URL — the URL path has no recognizable filename with an extension. Set the Filename field explicitly (e.g. "my-print.gcode").',
          );
        }
        return await simplyprintFiles.uploadUserFileFromUrl({
          auth: context.auth,
          url: rawUrl,
          filename,
        });
      }
      const filename = customName && customName.length > 0 ? customName : fileProp!.filename;
      return await simplyprintFiles.uploadUserFile({
        auth: context.auth,
        file: { filename, data: fileProp!.data },
      });
    })();

    // Step 2: commit the staged file into the user file system at folderId.
    // `folder` lives in $this->GET (get_validation), `fileId` /
    // `custom_fields` in $this->POST.
    const folderId = context.propsValue.folderId ?? 0;
    const body: Record<string, unknown> = { fileId: uploadResult.fileId };

    const submissions = simplyprintCustomFields.toSubmissionArray(context.propsValue.customFields ?? {});
    if (submissions.length > 0) body['custom_fields'] = submissions;

    const commitResp = await simplyprintClient.simplyprintCall<{ id?: string }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'files/Upload',
      queryParams: { folder: String(folderId) },
      body,
    });

    return {
      // UserFile.uid (string) — usable as `filesystem` source on Add to Queue / Start Print.
      userFileUid: commitResp.id ?? null,
      // The intermediate API file id (hex). Kept for callers that want it.
      apiFileId: uploadResult.fileId,
      uploadedFilename: uploadResult.name,
      uploadedSize: uploadResult.size,
      folderId,
      raw: commitResp,
    };
  },
});
