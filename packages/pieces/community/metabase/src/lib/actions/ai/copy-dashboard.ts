import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCopyDashboardOutputSchema } from '../../output-schemas';

export const copyDashboardAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_copy_dashboard',
  outputSchema: metabaseCopyDashboardOutputSchema,
  displayName: 'Copy Dashboard',
  description: 'Duplicate a dashboard.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a copy of a dashboard and returns it. A deep copy also duplicates its questions; a shallow copy reuses them. Each call creates another copy.',
    idempotent: false,
  },
  props: {
    dashboardId: metabaseAiProps.dashboardId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the copy. Empty = the original name.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    collectionId: metabaseAiProps.collectionId({
      required: false,
      description:
        'Collection for the copy, from List Collections. Empty = the root collection.',
    }),
    isDeepCopy: Property.Checkbox({
      displayName: 'Deep Copy',
      description: 'Also duplicate the questions on the dashboard.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.copyDashboard({
      auth,
      dashboardId: propsValue.dashboardId,
      body: {
        name: propsValue.name,
        description: propsValue.description,
        collection_id: propsValue.collectionId,
        is_deep_copy: propsValue.isDeepCopy ?? false,
      },
    });
  },
});
