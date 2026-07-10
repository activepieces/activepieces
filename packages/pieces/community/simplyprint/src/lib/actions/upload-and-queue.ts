import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { simplyprintCustomFields } from '../common/custom-fields';
import { simplyprintFiles } from '../common/files';
import { simplyprintProps } from '../common/props';

/**
 * Two-step composite: upload a local file through the integration-facing
 * files.simplyprint.io service, then add the resulting API file id to the
 * print queue. For printing it afterwards, chain a "Start Print" action
 * using either the returned `queueItemId` (via the "Queue item" source) or
 * the returned `fileId` (via the "API file" source).
 */
export const uploadAndQueueAction = createAction({
  auth: simplyprintAuth,
  name: 'upload_and_queue',
  displayName: 'Upload File & Add to Queue',
  description:
    'Upload a local file or HTTPS URL to SimplyPrint and add it to the print queue in one step. URL uploads stream with ~95 MiB peak RAM; File uploads are buffered by AP. Files over 95 MiB are chunked automatically. For starting the print afterwards, chain a "Start Print" action.',
  audience: 'both',
  aiMetadata: { description: 'Upload a print file (File input or HTTPS URL) and add it to the print queue in a single step, with quantity, group, target printers/models, tags, and custom fields; returns the new file ID and queue item ID. Pick this when the file is not yet on SimplyPrint; use add-to-queue if it already exists, and chain a start-print action to begin printing. Not idempotent — each call uploads and queues anew.', idempotent: false },
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
    groupId: simplyprintProps.queueGroupDropdown({ required: false }),
    amount: Property.Number({
      displayName: 'Quantity',
      description: 'Number of copies to queue (defaults to 1).',
      required: false,
      defaultValue: 1,
    }),
    position: simplyprintProps.queuePositionProp(),
    positionNumber: simplyprintProps.queuePositionNumberProp(),
    forPrinters: simplyprintProps.printerMultiSelectDropdown({
      required: false,
      displayName: 'Target printers',
      description:
        'Restrict this queue item to one or more specific printers. Leave empty to allow any eligible printer.',
    }),
    forModels: simplyprintProps.printerModelMultiSelectDropdown({ required: false }),
    customTags: simplyprintProps.tagMultiSelectDropdown({ required: false }),
    nozzleSize: simplyprintProps.nozzleSizeProp(),
    nozzleType: simplyprintProps.nozzleTypeProp(),
    nozzleVolumeType: simplyprintProps.nozzleVolumeTypeProp(),
    bedType: simplyprintProps.bedTypeDropdown(),
    customFields: Property.Object({
      displayName: 'Custom fields',
      description:
        'Optional. Object keyed by custom-field UUID (fieldId) → value. PRINT_QUEUE category is auto-applied.',
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

    const body: Record<string, unknown> = {
      fileId: uploadResult.fileId,
      amount: context.propsValue.amount ?? 1,
      position: simplyprintProps.resolveQueuePosition(
        context.propsValue.position as string | undefined,
        context.propsValue.positionNumber as number | undefined,
      ),
    };

    if (context.propsValue.groupId) body['group'] = context.propsValue.groupId;

    const forPrinters = (context.propsValue.forPrinters ?? []) as number[];
    if (forPrinters.length > 0) body['for_printers'] = forPrinters.join(',');

    const forModels = (context.propsValue.forModels ?? []) as number[];
    if (forModels.length > 0) body['for_models'] = forModels.join(',');

    const tags = simplyprintProps.buildTagsBody({
      customTagIds: context.propsValue.customTags as number[] | undefined,
      nozzleSize: context.propsValue.nozzleSize as number | undefined,
      nozzleType: context.propsValue.nozzleType as string | undefined,
      nozzleVolumeType: context.propsValue.nozzleVolumeType as string | undefined,
      bedType: context.propsValue.bedType as string | undefined,
    });
    if (tags) body['tags'] = tags;

    const submissions = simplyprintCustomFields.toSubmissionArray(context.propsValue.customFields ?? {});
    if (submissions.length > 0) body['custom_fields'] = submissions;

    const queueResp = await simplyprintClient.simplyprintCall<{ created_id?: number; id?: number }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/AddItem',
      body,
    });

    const queueFlat = queueResp as unknown as Record<string, unknown>;
    const queueItemId =
      (queueFlat['created_id'] as number | undefined) ??
      (queueFlat['id'] as number | undefined) ??
      null;

    return {
      fileId: uploadResult.fileId,
      queueItemId,
      raw: { upload: uploadResult.raw, queue: queueResp },
    };
  },
});
