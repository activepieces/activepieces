import { createAction } from '@activepieces/pieces-framework';
import { knackAuth } from '../common/auth';
import { knackListObjects } from '../common/props';
import { listObjectsOutputSchema } from '../common/schemas';

export const listObjectsAction = createAction({
  auth: knackAuth,
  name: 'list_objects',
  classification: 'READ',
  displayName: 'List Objects (Agent)',
  description: 'Lists the objects (tables) in the Knack app.',
  audience: 'ai',
  outputSchema: listObjectsOutputSchema,
  aiMetadata: {
    description: 'Lists every object (table) in the connected Knack app with its key (e.g. "object_1") and name. Call this first to resolve an object key for the other Knack tools. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const objects = await knackListObjects({ auth });
    return {
      objects: objects.map((object) => ({ key: object.key, name: object.name })),
    };
  },
});
