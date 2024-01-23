import { createAction, Property } from '@activepieces/pieces-framework';
import { createQuestion } from '../api';
import { buildMemberSpacesDropdown } from '../props';
import { bettermodeAuth, BettermodeAuthType } from '../auth';

export const createQuestionAction = createAction({
  name: 'create_question',
  auth: bettermodeAuth,
  displayName: 'Create Question Post',
  description: 'Create a new question post in a space',
  props: {
    spaceId: Property.Dropdown({
      displayName: 'Space',
      description: 'The space to create the question in',
      required: true,
      refreshers: [],
      options: async ({ auth }) =>
        await buildMemberSpacesDropdown(auth as BettermodeAuthType),
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the question',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content of the question',
      required: true,
    }),
    tagNames: Property.ShortText({
      displayName: 'Tags',
      description: 'The tags to add to the question',
      required: false,
    }),
    locked: Property.Checkbox({
      displayName: 'Locked',
      description: 'If the question should be locked',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    return await createQuestion(
      context.auth as BettermodeAuthType,
      context.propsValue.spaceId,
      context.propsValue.tagNames ?? '',
      context.propsValue.title,
      context.propsValue.content,
      context.propsValue.locked
    );
  },
});
