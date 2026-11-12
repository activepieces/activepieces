import { createAction } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { youtrackClient } from '../common/client';
import { listLinkTypesActionOutputSchema } from '../output-schemas';

export const listLinkTypesAction = createAction({
  auth: youtrackAuth,
  name: 'list_link_types',
  classification: 'SEARCH',
  outputSchema: listLinkTypesActionOutputSchema,
  displayName: 'List Link Types',
  description: 'Lists the issue link types (relates to, depends on, duplicates, subtask of, ...).',
  audience: 'both',
  aiMetadata: {
    description:
      'List the issue link types configured in YouTrack, with each type\'s name, outward phrase (sourceToTarget, e.g. "is required for") and inward phrase (targetToSource, e.g. "depends on"). Either phrase can be passed as the link type phrase to Link Issues. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const types = await youtrackClient.listAll({
      auth: context.auth,
      path: '/issueLinkTypes',
      query: { fields: 'id,name,sourceToTarget,targetToSource,directed,aggregation,readOnly' },
      maxItems: 1000,
      operation: 'list link types',
    });
    return {
      items: types.map((t) => ({
        id: t['id'] ?? null,
        name: t['name'] ?? null,
        sourceToTarget: t['sourceToTarget'] ?? null,
        targetToSource: t['targetToSource'] ?? null,
        directed: t['directed'] ?? null,
        aggregation: t['aggregation'] ?? null,
        readOnly: t['readOnly'] ?? null,
      })),
    };
  },
});
