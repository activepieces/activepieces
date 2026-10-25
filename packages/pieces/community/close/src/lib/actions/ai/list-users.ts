import { createAction, Property } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

export const listUsers = createAction({
  auth: closeAuth,
  name: 'list_users',
  classification: 'SEARCH',
  displayName: 'List Users',
  description: 'List the users in your Close organization.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the users (sales reps) in the Close organization with id (user_...), email, name and organization IDs. Use the ids to assign tasks or opportunities. Paged with limit (1-100) and skip (use nextSkip). Read-only.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.users,
  props: {
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 100', required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Use nextSkip from the previous call.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = closeClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 });
    const skip = closeClient.parseInteger({ value: propsValue.skip, label: 'Skip', min: 0, max: 1_000_000 });
    const page = await closeClient.listPage({ auth, path: '/user/', limit, skip });
    return closeMappers.offsetPage({ ...page, map: closeMappers.user });
  },
});
