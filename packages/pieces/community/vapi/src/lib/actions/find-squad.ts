import { createAction, Property } from '@activepieces/pieces-framework';
import { vapiAuth } from '../auth';
import { vapiUtils } from '../common/vapi-api';
import { vapiResources } from '../common/props';
import { vapiFlatten } from '../common/flatten';
import { vapiOutputSchemas } from '../common/output-schemas';

export const findSquad = createAction({
  auth: vapiAuth,
  name: 'find_squad',
  classification: 'SEARCH',
  displayName: 'Find Squad',
  description: 'Find squads by name.',
  audience: 'ai',
  outputSchema: vapiOutputSchemas.findSquad,
  aiMetadata: {
    description:
      'Finds squads (groups of assistants that hand calls to each other) in the Vapi organization and returns each one\'s ID, name and member assistant IDs, newest first. Optional Name Contains matches part of the name, case-insensitive. Matching is done by this tool over the 1000 most recent squads. Use the ID with Get Squad or as the squad ID in Update Phone Number. Read-only.',
    idempotent: true,
  },
  props: {
    nameContains: Property.ShortText({ displayName: 'Name Contains', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Maximum results (1-100). Defaults to 20.', required: false }),
  },
  async run(context) {
    const needle = context.propsValue.nameContains?.trim() ?? '';
    const squads = await vapiResources.find({
      apiKey: context.auth.secret_text,
      path: '/squad',
      operation: 'list squads',
      flatten: vapiFlatten.squadSummary,
      matches: (item) => needle === '' || vapiUtils.containsIgnoreCase({ haystack: item.name, needle }),
      limit: vapiUtils.clampLimit({ value: context.propsValue.limit, defaultValue: 20, max: 100 }),
    });
    return { squads };
  },
});
