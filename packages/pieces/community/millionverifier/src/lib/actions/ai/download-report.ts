import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { parse } from 'csv-parse/sync';
import { millionVerifierAuth } from '../../auth';
import { millionVerifierAiProps } from '../../common/ai-props';
import { millionVerifierClient } from '../../common/client';
import { millionverifierDownloadReportOutputSchema } from '../../output-schemas';

const FILTERS = ['ok', 'ok_and_catch_all', 'unknown', 'invalid', 'all', 'custom'];
const STATUSES = ['ok', 'catch_all', 'unknown', 'invalid', 'disposable'];
const BOOLEAN_OPTIONS = { options: [{ label: 'True', value: 'true' }, { label: 'False', value: 'false' }] };

export const downloadReportAction = createAction({
  auth: millionVerifierAuth,
  name: 'millionverifier_download_report',
  outputSchema: millionverifierDownloadReportOutputSchema,
  displayName: 'Download Bulk Report',
  description: 'Downloads the verification results of a bulk file as rows.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Downloads the verification results of a bulk file as rows, one per email, filtered by result. Use it once Get Bulk File reports status "finished" (or after Stop Bulk File). Statuses, Free and Role apply only with filter "custom".',
    idempotent: true,
  },
  props: {
    fileId: millionVerifierAiProps.fileId({ required: true }),
    filter: Property.StaticDropdown({
      displayName: 'Filter',
      description: `Which results to include: ${FILTERS.join(', ')}. "custom" uses Statuses, Free and Role.`,
      required: true,
      options: { options: FILTERS.map((filter) => ({ label: filter, value: filter })) },
    }),
    statuses: Property.StaticMultiSelectDropdown({
      displayName: 'Statuses',
      description: `With filter "custom" only: results to include, from ${STATUSES.join(', ')}. Empty includes all.`,
      required: false,
      options: { options: STATUSES.map((status) => ({ label: status, value: status })) },
    }),
    free: Property.StaticDropdown({
      displayName: 'Free',
      description: 'With filter "custom" only: "true" for free-provider emails only, "false" to exclude them. Empty includes both.',
      required: false,
      options: BOOLEAN_OPTIONS,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'With filter "custom" only: "true" for role emails (info@, sales@) only, "false" to exclude them. Empty includes both.',
      required: false,
      options: BOOLEAN_OPTIONS,
    }),
  },
  async run(context) {
    const { fileId, filter, statuses, free, role } = context.propsValue;
    if (!FILTERS.includes(filter)) {
      throw new Error(`Filter must be one of: ${FILTERS.join(', ')}.`);
    }
    const invalid = (statuses ?? []).filter((status) => !STATUSES.includes(status));
    if (invalid.length > 0) {
      throw new Error(`Statuses has unsupported values: ${invalid.join(', ')}. Allowed: ${STATUSES.join(', ')}.`);
    }
    const hasCustomOptions = (statuses ?? []).length > 0 || Boolean(free) || Boolean(role);
    if (hasCustomOptions && filter !== 'custom') {
      throw new Error('Statuses, Free and Role only apply when Filter is "custom".');
    }
    const csv = await millionVerifierClient.bulkRequest<string>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/v2/download',
      query: {
        file_id: fileId,
        filter,
        ...(statuses && statuses.length > 0 ? { statuses: statuses.join(',') } : {}),
        ...(free ? { free: free === 'true' ? '1' : '0' } : {}),
        ...(role ? { role: role === 'true' ? '1' : '0' } : {}),
      },
    });
    const rows: Record<string, string>[] = csv ? parse(csv, { columns: true, skip_empty_lines: true, bom: true }) : [];
    return { rows, count: rows.length };
  },
});
