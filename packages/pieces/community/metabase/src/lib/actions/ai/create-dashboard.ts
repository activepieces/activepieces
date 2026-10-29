import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateDashboardOutputSchema } from '../../output-schemas';

export const createDashboardAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_dashboard',
  outputSchema: metabaseCreateDashboardOutputSchema,
  displayName: 'Create Dashboard',
  description: 'Create an empty dashboard.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new, empty dashboard in a collection. Add cards afterwards with Update Dashboard (dashcards). Each call creates a new dashboard.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    collectionId: metabaseAiProps.collectionId({ required: false }),
    parameters: Property.Json({
      displayName: 'Parameters',
      description:
        'Dashboard filters, as an array: [{"id": "a1b2c3d4", "name": "Category", "slug": "category", "type": "string/="}]. Empty = no filters.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.createDashboard({
      auth,
      body: {
        name: propsValue.name,
        description: propsValue.description,
        collection_id: propsValue.collectionId,
        parameters: propsValue.parameters,
      },
    });
  },
});
