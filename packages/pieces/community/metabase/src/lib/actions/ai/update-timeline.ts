import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseUpdateTimelineOutputSchema } from '../../output-schemas';

export const updateTimelineAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_update_timeline',
  outputSchema: metabaseUpdateTimelineOutputSchema,
  displayName: 'Update Timeline',
  description: 'Rename, move or archive a timeline.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a timeline. Archived = Yes hides it and its events (recoverable).',
    idempotent: true,
  },
  props: {
    timelineId: metabaseAiProps.timelineId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name. Empty = unchanged.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description. Empty = unchanged.',
      required: false,
    }),
    collectionId: metabaseAiProps.collectionId({
      required: false,
      description: 'Move to this collection. Empty = unchanged.',
    }),
    archived: metabaseAiProps.yesNo({
      displayName: 'Archived',
      description:
        'Yes archives the timeline, No restores it. Empty = unchanged.',
      required: false,
    }),
    icon: Property.StaticDropdown({
      displayName: 'Icon',
      description: 'Icon shown on charts. Empty = unchanged.',
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
    return await metabaseApi.updateTimeline({
      auth,
      timelineId: propsValue.timelineId,
      body: {
        name: propsValue.name,
        description: propsValue.description,
        collection_id: propsValue.collectionId,
        archived: propsValue.archived,
        icon: propsValue.icon,
      },
    });
  },
});
