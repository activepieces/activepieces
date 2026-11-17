import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiUtils } from '../common/vapi-api';
import { vapiResources } from '../common/props';
import { vapiFlatten } from '../common/flatten';
import { vapiOutputSchemas } from '../common/output-schemas';

export const findAssistant = createAction({
  auth: vapiAuth,
  name: 'find_assistant',
  classification: 'SEARCH',
  displayName: 'Find Assistant',
  description: 'Find assistants by name.',
  audience: 'ai',
  outputSchema: vapiOutputSchemas.findAssistant,
  aiMetadata: {
    description:
      'Finds Vapi assistants and returns each one\'s ID, name and creation time, newest first. Optional Name Contains matches part of the name, case-insensitive; leave it empty to list all. The name match is done by this tool over the 1000 most recent assistants, because Vapi has no name search. Use the returned ID in Place Call, Get Assistant or Update Assistant Settings. Read-only.',
    idempotent: true,
  },
  props: {
    nameContains: Property.ShortText({ displayName: 'Name Contains', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Maximum results (1-100). Defaults to 20.', required: false }),
  },
  async run(context) {
    const needle = context.propsValue.nameContains?.trim() ?? '';
    const assistants = await vapiResources.find({
      apiKey: context.auth.secret_text,
      path: '/assistant',
      operation: 'list assistants',
      flatten: vapiFlatten.assistantSummary,
      matches: (item) => needle === '' || vapiUtils.containsIgnoreCase({ haystack: item.name, needle }),
      limit: vapiUtils.clampLimit({ value: context.propsValue.limit, defaultValue: 20, max: 100 }),
    });
    return { assistants };
  },
});
