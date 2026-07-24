import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';

export const listChangelogs = createAction({
  auth: produktlyAuth,
  name: 'list_changelogs',
  displayName: 'List Changelogs',
  description: 'List all changelogs in your Produktly account.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of changelogs to return (1-100, default 50).',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of changelogs to skip for pagination (default 0).',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await produktlyApiCall<{
      data: Array<{
        id: number;
        name: string;
        active: boolean;
        createdAt: string;
      }>;
      pagination: { total: number; limit: number; offset: number };
    }>({
      auth,
      method: HttpMethod.GET,
      path: '/changelogs',
      queryParams: {
        limit: String(propsValue.limit ?? 50),
        offset: String(propsValue.offset ?? 0),
      },
    });
    return response.body.data.map((changelog) => ({
      changelog_id: changelog.id,
      changelog_name: changelog.name,
      changelog_active: changelog.active,
      changelog_created_at: changelog.createdAt,
    }));
  },
});
