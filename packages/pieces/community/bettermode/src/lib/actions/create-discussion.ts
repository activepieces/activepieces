import { createAction, Property } from '@activepieces/pieces-framework';
import { createDiscussion } from '../api';
import { buildMemberSpacesDropdown } from '../props';
import { bettermodeAuth, BettermodeAuthType } from '../auth';

export const createDiscussionAction = createAction({
  name: 'create_discussion',
  auth: bettermodeAuth,
  displayName: 'Create Discussion Post',
  description: 'Create a new discussion post in a space',
  props: {
    spaceId: Property.Dropdown({
      displayName: 'Space',
      description: 'The space to create the discussion in',
      required: true,
      refreshers: [],
      options: async ({ auth }) =>
        await buildMemberSpacesDropdown(auth as BettermodeAuthType),
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the discussion',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content of the discussion',
      required: true,
    }),
    tagNames: Property.ShortText({
      displayName: 'Tags',
      description: 'The tags to add to the discussion',
      required: false,
    }),
    locked: Property.Checkbox({
      displayName: 'Locked',
      description: 'If the discussion should be locked',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    return await createDiscussion(
      context.auth as BettermodeAuthType,
      context.propsValue.spaceId,
      context.propsValue.tagNames ?? '',
      context.propsValue.title,
      context.propsValue.content,
      context.propsValue.locked
    );
  },
});
