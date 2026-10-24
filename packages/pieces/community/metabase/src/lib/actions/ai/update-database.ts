import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateDatabaseOutputSchema } from '../../output-schemas';

export const updateDatabaseAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_database',
  outputSchema: metabaseUpdateDatabaseOutputSchema,
  displayName: 'Update Database',
  description: "Update a connected database's settings.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a connected database: display name, description, caveats, auto-run and cache settings. Connection credentials are not changed. Needs an admin key.',
    idempotent: true,
  },
  props: {
    databaseId: metabaseAiProps.databaseId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New display name. Empty = unchanged.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description. Empty = unchanged.',
      required: false,
    }),
    caveats: Property.LongText({
      displayName: 'Caveats',
      description:
        'Things users should know about this data. Empty = unchanged.',
      required: false,
    }),
    pointsOfInterest: Property.LongText({
      displayName: 'Points of Interest',
      description: 'What is useful about this data. Empty = unchanged.',
      required: false,
    }),
    autoRunQueries: metabaseAiProps.yesNo({
      displayName: 'Auto-run Queries',
      description:
        'Run query-builder questions automatically. Empty = unchanged.',
      required: false,
    }),
    cacheTtl: Property.Number({
      displayName: 'Cache TTL (hours)',
      description: 'How long to cache query results. Empty = unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.updateDatabase({
      auth,
      databaseId: propsValue.databaseId,
      body: {
        name: propsValue.name,
        description: propsValue.description,
        caveats: propsValue.caveats,
        points_of_interest: propsValue.pointsOfInterest,
        auto_run_queries: propsValue.autoRunQueries,
        cache_ttl: propsValue.cacheTtl,
      },
    });
  },
});
