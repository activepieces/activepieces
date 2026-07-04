import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { simplyprintCustomFields } from '../common/custom-fields';
import { simplyprintProps } from '../common/props';

export const addToQueueAction = createAction({
  auth: simplyprintAuth,
  name: 'add_to_queue',
  displayName: 'Add File to Queue',
  description:
    'Add an existing file (API-uploaded or user-file) to the print queue. For uploading a new file at the same time, use "Upload File & Add to Queue".',
  audience: 'both',
  aiMetadata: { description: 'Queue an already-uploaded file for printing — choose the source (an API file hex ID from an upload step, or an existing user-file UID) plus quantity, target group, printers/models, tags, and custom fields. Use this when the file already exists on SimplyPrint; to upload and queue together use the upload-and-queue tool. Not idempotent — each call adds a new queue item.', idempotent: false },
  props: {
    fileSource: Property.StaticDropdown<'apiFile' | 'userFile'>({
      displayName: 'File source',
      required: true,
      defaultValue: 'apiFile',
      options: {
        options: [
          { label: 'API file (hex id from Upload File action)', value: 'apiFile' },
          { label: 'User file (existing library file)', value: 'userFile' },
        ],
      },
    }),
    apiFileId: Property.ShortText({
      displayName: 'API file ID',
      description:
        'Hex id returned by Upload File. Required when source is "API file".',
      required: false,
    }),
    userFileUid: Property.ShortText({
      displayName: 'User file UID',
      description:
        'UID of an existing user-file (from "List Files"). Required when source is "User file". Accepts only the single file UID string.',
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
    const source = context.propsValue.fileSource ?? 'apiFile';
    const body: Record<string, unknown> = {
      amount: context.propsValue.amount ?? 1,
      position: simplyprintProps.resolveQueuePosition(
        context.propsValue.position as string | undefined,
        context.propsValue.positionNumber as number | undefined,
      ),
    };

    if (context.propsValue.groupId) body['group'] = context.propsValue.groupId;

    if (source === 'apiFile') {
      const apiFileId = context.propsValue.apiFileId;
      if (!apiFileId) throw new Error('API file ID is required when source is "API file".');
      body['fileId'] = apiFileId;
    } else {
      const uid = context.propsValue.userFileUid;
      if (!uid) throw new Error('User file UID is required when source is "User file".');
      body['filesystem'] = uid;
    }

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

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'queue/AddItem',
      body,
    });
  },
});
