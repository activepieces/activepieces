import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiUtils } from '../common/vapi-api';
import { vapiResources } from '../common/props';
import { vapiFlatten } from '../common/flatten';
import { vapiOutputSchemas } from '../common/output-schemas';

export const findTool = createAction({
  auth: vapiAuth,
  name: 'find_tool',
  classification: 'SEARCH',
  displayName: 'Find Tool',
  description: 'Find tools by name or type.',
  audience: 'ai',
  outputSchema: vapiOutputSchemas.findTool,
  aiMetadata: {
    description:
      'Finds tools in the Vapi organization and returns each one\'s ID, type, name and description, newest first. Optional Name Contains matches part of the function name, case-insensitive; optional Type must equal the tool type exactly (e.g. function, transferCall, endCall, apiRequest, query). Matching is done by this tool over the 1000 most recent tools. If Truncated is true, more records exist than were scanned and a match may be missing: use a more specific value or the ID from the Vapi dashboard. Use the ID with Get Tool. Read-only.',
    idempotent: true,
  },
  props: {
    nameContains: Property.ShortText({ displayName: 'Name Contains', required: false }),
    type: Property.ShortText({ displayName: 'Type', description: 'e.g. function, transferCall, endCall, apiRequest, query.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Maximum results (1-100). Defaults to 20.', required: false }),
  },
  async run(context) {
    const needle = context.propsValue.nameContains?.trim() ?? '';
    const type = context.propsValue.type?.trim() ?? '';
    const { items: tools, truncated } = await vapiResources.find({
      apiKey: context.auth.secret_text,
      path: '/tool',
      operation: 'list tools',
      flatten: vapiFlatten.toolSummary,
      matches: (item) =>
        (needle === '' || vapiUtils.containsIgnoreCase({ haystack: item.name, needle })) &&
        (type === '' || (item.type !== null && item.type.toLowerCase() === type.toLowerCase())),
      limit: vapiUtils.clampLimit({ value: context.propsValue.limit, defaultValue: 20, max: 100 }),
    });
    return { tools, truncated };
  },
});
