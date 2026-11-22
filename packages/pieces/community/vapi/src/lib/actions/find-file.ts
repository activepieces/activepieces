import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiUtils } from '../common/vapi-api';
import { vapiResources } from '../common/props';
import { vapiFlatten } from '../common/flatten';
import { vapiOutputSchemas } from '../common/output-schemas';

export const findFile = createAction({
  auth: vapiAuth,
  name: 'find_file',
  classification: 'SEARCH',
  displayName: 'Find File',
  description: 'Find knowledge-base files by name.',
  audience: 'ai',
  outputSchema: vapiOutputSchemas.findFile,
  aiMetadata: {
    description:
      'Finds knowledge-base files uploaded to Vapi and returns each one\'s ID, name, processing status, size in bytes and creation time, newest first. Optional Name Contains matches part of the file name, case-insensitive. Matching is done by this tool over the 1000 most recent files. If Truncated is true, more records exist than were scanned and a match may be missing: use a more specific value or the ID from the Vapi dashboard. Use the ID with Get File. Read-only.',
    idempotent: true,
  },
  props: {
    nameContains: Property.ShortText({ displayName: 'Name Contains', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Maximum results (1-100). Defaults to 20.', required: false }),
  },
  async run(context) {
    const needle = context.propsValue.nameContains?.trim() ?? '';
    const { items: files, truncated } = await vapiResources.find({
      apiKey: context.auth.secret_text,
      path: '/file',
      operation: 'list files',
      flatten: vapiFlatten.fileSummary,
      matches: (item) => needle === '' || vapiUtils.containsIgnoreCase({ haystack: item.name, needle }),
      limit: vapiUtils.clampLimit({ value: context.propsValue.limit, defaultValue: 20, max: 100 }),
    });
    return { files, truncated };
  },
});
