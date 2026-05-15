import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { simplyprintCustomFields, CustomFieldValueSubmission } from '../common/custom-fields';
import { simplyprintProps } from '../common/props';
import { simplyprintStartOptions } from '../common/start-options';

export const startPrintAction = createAction({
  auth: simplyprintAuth,
  name: 'start_print',
  displayName: 'Start Print',
  description:
    'Start a print job on one or more printers from an existing file, queue item, or print-job reference.',
  props: {
    printerIds: simplyprintProps.printerMultiSelectDropdown({ required: true }),
    fileSource: Property.StaticDropdown<'apiFile' | 'userFile' | 'queueItem'>({
      displayName: 'File source',
      description: 'Which kind of existing reference to start from.',
      required: true,
      defaultValue: 'apiFile',
      options: {
        options: [
          { label: 'API file (hash from Upload File action)', value: 'apiFile' },
          { label: 'User file (existing UserFile.uid)', value: 'userFile' },
          { label: 'Queue item (pending queue item ID)', value: 'queueItem' },
        ],
      },
    }),
    apiFileId: Property.ShortText({
      displayName: 'API file ID',
      description:
        'Required when source is "API file". Hex hash returned by Upload File.',
      required: false,
    }),
    userFileUid: Property.ShortText({
      displayName: 'User file UID',
      description: 'Required when source is "User file". The UserFile.uid string.',
      required: false,
    }),
    queueItemId: Property.Number({
      displayName: 'Queue item ID',
      description: 'Required when source is "Queue item".',
      required: false,
    }),
    sharedCustomFields: Property.Object({
      displayName: 'Shared custom fields',
      description:
        'Custom-field values applied to every started job (PRINT_JOB). Keyed by custom-field UUID (fieldId) → value.',
      required: false,
    }),
    individualCustomFields: Property.LongText({
      displayName: 'Individual custom fields (JSON)',
      description:
        'Optional. JSON array `[{"id": <queueItemId>, "value": {"<fieldId>": <value>}}]`. Per-item PRINT_JOB custom fields when starting a multi-queue job.',
      required: false,
    }),
    startOptions: simplyprintStartOptions.buildStartOptionsProp(),
    mmsMap: Property.LongText({
      displayName: 'MMS map (JSON)',
      description:
        'Optional. JSON object mapping printer id → multi-material slot configuration. Leave empty for single-material printers.',
      required: false,
    }),
  },
  async run(context) {
    const printerIds = (context.propsValue.printerIds ?? []) as number[];
    if (!printerIds.length) throw new Error('Pick at least one printer.');

    const source = context.propsValue.fileSource ?? 'apiFile';
    const body: Record<string, unknown> = {
      pid: printerIds.join(','),
    };

    if (source === 'apiFile') {
      const apiFileId = context.propsValue.apiFileId;
      if (!apiFileId) throw new Error('API file ID is required when source is "API file".');
      body['file_id'] = apiFileId;
    } else if (source === 'userFile') {
      const uid = context.propsValue.userFileUid;
      if (!uid) throw new Error('User file UID is required when source is "User file".');
      body['filesystem'] = uid;
    } else {
      const qid = context.propsValue.queueItemId;
      if (!qid) throw new Error('Queue item ID is required when source is "Queue item".');
      body['queue_file'] = qid;
    }

    const shared = simplyprintCustomFields.toSubmissionArray(context.propsValue.sharedCustomFields ?? {});
    if (shared.length > 0) body['custom_fields'] = shared;

    const individualRaw = parseJsonProp<Array<{ id: number; value: Record<string, unknown> }>>(
      context.propsValue.individualCustomFields,
      'Individual custom fields',
    );
    if (individualRaw && Array.isArray(individualRaw) && individualRaw.length > 0) {
      const individual: IndividualCustomField[] = individualRaw.map((entry) => ({
        id: Number(entry.id),
        value: simplyprintCustomFields.toSubmissionArray(entry.value ?? {}),
      }));
      body['individual_custom_fields'] = individual;
    }

    const startOptions = simplyprintStartOptions.normalizeStartOptions(
      context.propsValue.startOptions as Record<string, unknown> | undefined,
    );
    if (startOptions) body['start_options'] = startOptions;

    const mmsMap = parseJsonProp<Record<string, unknown>>(
      context.propsValue.mmsMap,
      'MMS map',
    );
    if (mmsMap) body['mms_map'] = JSON.stringify(mmsMap);

    const res = await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'printers/actions/CreateJob',
      body,
    });

    const flat = res as unknown as Record<string, unknown>;
    const jobIdsRaw = flat['job_ids'] ?? flat['jobIds'] ?? flat['jobs'] ?? null;
    return { jobIds: jobIdsRaw, raw: res };
  },
});

function parseJsonProp<T>(raw: unknown, label: string): T | null {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'object') return raw as T;
  if (typeof raw !== 'string') {
    throw new Error(`${label} must be JSON text or an object.`);
  }
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new Error(`${label} is not valid JSON: ${(e as Error).message}`);
  }
}

interface IndividualCustomField {
  id: number;
  value: CustomFieldValueSubmission[];
}
