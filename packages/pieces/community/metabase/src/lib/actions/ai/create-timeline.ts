import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseCreateTimelineOutputSchema } from '../../output-schemas';

export const createTimelineAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_create_timeline',
  outputSchema: metabaseCreateTimelineOutputSchema,
  displayName: 'Create Timeline',
  description: 'Create an event timeline in a collection.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an event timeline in a collection; add events with Create Timeline Event. Each call creates a new timeline.',
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
    icon: Property.StaticDropdown({
      displayName: 'Icon',
      description: 'Icon shown on charts. Empty = default.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Star', value: 'star' },
          { label: 'Cake', value: 'cake' },
          { label: 'Mail', value: 'mail' },
          { label: 'Warning', value: 'warning' },
          { label: 'Bell', value: 'bell' },
          { label: 'Cloud', value: 'cloud' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.createTimeline({
      auth,
      body: {
        name: propsValue.name,
        description: propsValue.description,
        collection_id: propsValue.collectionId,
        icon: propsValue.icon,
      },
    });
  },
});
