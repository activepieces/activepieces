import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListCollectionTimelinesOutputSchema } from '../../output-schemas';

export const listCollectionTimelinesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_collection_timelines',
  outputSchema: metabaseListCollectionTimelinesOutputSchema,
  displayName: 'List Collection Timelines',
  description: 'List the timelines of one collection.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the timelines in one collection (empty Collection ID = the root collection), optionally with their events.',
    idempotent: true,
  },
  props: {
    collectionId: metabaseAiProps.collectionId({ required: false }),
    includeEvents: Property.Checkbox({
      displayName: 'Include Events',
      description: "Also return each timeline's events.",
      required: false,
      defaultValue: false,
    }),
    archived: Property.Checkbox({
      displayName: 'Archived',
      description: 'Return archived items instead of active ones.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const timelines = await metabaseApi.listCollectionTimelines({
      auth,
      collectionId: propsValue.collectionId ?? 'root',
      include: propsValue.includeEvents ? 'events' : undefined,
      archived: propsValue.archived ?? false,
    });
    return { timelines, count: timelines.length };
  },
});
