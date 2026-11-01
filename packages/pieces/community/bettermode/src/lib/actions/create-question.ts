import { createAction, Property } from '@activepieces/pieces-framework';
import { bindTokenStore } from '../common/client';
import { bettermodeAuth } from '../auth';
import { bettermodeSchemas } from '../common/schemas';
import { memberSpacesDropdown } from '../common/props';
import { createLegacyPost } from './create-post-of-type';

export const createQuestionAction = createAction({
  name: 'create_question',
  classification: 'WRITE',
  auth: bettermodeAuth,
  displayName: 'Create Question Post',
  description: 'Create a new question post in a space',
  audience: 'human',
  aiMetadata: {
    description:
      'Publishes a new post of the community post type named exactly "Question" into a space the connected member has joined. Agents should use List Post Types and Create Post instead. Each call creates a separate post, so retries duplicate.',
    idempotent: false,
  },
  props: {
    spaceId: memberSpacesDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the question',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The content of the question. HTML is supported.',
      required: true,
    }),
    tagNames: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated tag names to add, for example onboarding, feedback. Leave empty for no tags.',
      required: false,
    }),
    locked: Property.Checkbox({
      displayName: 'Locked',
      description: 'If the question should be locked',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: bettermodeSchemas.legacyPost,
  async run(context) {
    bindTokenStore({ credentials: context.auth.props, store: context.store });
    return createLegacyPost({
      auth: context.auth.props,
      postTypeName: 'Question',
      propsValue: context.propsValue,
    });
  },
});
