import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { millionVerifierAuth } from '../../auth';
import { millionVerifierClient } from '../../common/client';
import type { MillionVerifierFileList } from '../../common/types';
import { millionverifierListFilesOutputSchema } from '../../output-schemas';

const STATUSES = ['in_progress', 'error', 'finished', 'canceled', 'paused', 'in_queue_to_start'];

export const listFilesAction = createAction({
  auth: millionVerifierAuth,
  name: 'millionverifier_list_files',
  outputSchema: millionverifierListFilesOutputSchema,
  displayName: 'List Bulk Files',
  description: 'Lists bulk verification files, newest first, with optional filters.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists bulk verification files with their status and result counts, one page at a time (up to 50). Filter by file IDs, name, status, dates or progress; page with offset. Use it to find a file_id for Get Bulk File, Download Bulk Report, Stop Bulk File or Delete Bulk File.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Files per page, 1 to 50. Defaults to 50.',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of files to skip, for paging. Defaults to 0.',
      required: false,
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'Only these file IDs, e.g. ["32502003"].',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Only files whose name contains this text.',
      required: false,
    }),
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Statuses',
      description: `Only files in these states: ${STATUSES.join(', ')}.`,
      required: false,
      options: { options: STATUSES.map((status) => ({ label: status, value: status })) },
    }),
    createdFrom: Property.ShortText({
      displayName: 'Created From',
      description: 'Only files created after this time, format "yyyy-MM-dd HH:mm:ss" (UTC), e.g. "2026-01-01 00:00:00".',
      required: false,
    }),
    createdTo: Property.ShortText({
      displayName: 'Created To',
      description: 'Only files created before this time, format "yyyy-MM-dd HH:mm:ss".',
      required: false,
    }),
    updatedFrom: Property.ShortText({
      displayName: 'Updated From',
      description: 'Only files updated after this time, format "yyyy-MM-dd HH:mm:ss".',
      required: false,
    }),
    updatedTo: Property.ShortText({
      displayName: 'Updated To',
      description: 'Only files updated before this time, format "yyyy-MM-dd HH:mm:ss".',
      required: false,
    }),
    percentFrom: Property.Number({
      displayName: 'Percent From',
      description: 'Only files at least this percent done (0-100).',
      required: false,
    }),
    percentTo: Property.Number({
      displayName: 'Percent To',
      description: 'Only files at most this percent done (0-100).',
      required: false,
    }),
    hasError: Property.StaticDropdown({
      displayName: 'Has Error',
      description: 'Only files that failed ("true") or did not fail ("false"). Leave empty for both.',
      required: false,
      options: { options: [{ label: 'True', value: 'true' }, { label: 'False', value: 'false' }] },
    }),
  },
  async run(context) {
    const { limit, offset, fileIds, name, statuses, createdFrom, createdTo, updatedFrom, updatedTo, percentFrom, percentTo, hasError } = context.propsValue;
    const invalid = (statuses ?? []).filter((status) => !STATUSES.includes(status));
    if (invalid.length > 0) {
      throw new Error(`Statuses has unsupported values: ${invalid.join(', ')}. Allowed: ${STATUSES.join(', ')}.`);
    }
    const query: Record<string, string> = {
      limit: String(Math.min(Math.max(limit ?? 50, 1), 50)),
      offset: String(offset ?? 0),
      ...(fileIds && fileIds.length > 0 ? { id: fileIds.map(String).join(',') } : {}),
      ...(name ? { name } : {}),
      ...(statuses && statuses.length > 0 ? { status: statuses.join(',') } : {}),
      ...(createdFrom ? { createdate_from: createdFrom } : {}),
      ...(createdTo ? { createdate_to: createdTo } : {}),
      ...(updatedFrom ? { updated_at_from: updatedFrom } : {}),
      ...(updatedTo ? { updated_at_to: updatedTo } : {}),
      ...(isSet(percentFrom) ? { percent_from: String(percentFrom) } : {}),
      ...(isSet(percentTo) ? { percent_to: String(percentTo) } : {}),
      ...(hasError ? { has_error: hasError } : {}),
    };
    return await millionVerifierClient.bulkRequest<MillionVerifierFileList>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v2/filelist',
      query,
    });
  },
});

function isSet(value: number | null | undefined): value is number {
  return value !== undefined && value !== null;
}
