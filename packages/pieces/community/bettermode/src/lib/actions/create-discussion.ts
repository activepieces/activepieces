import { createAction, Property } from '@activepieces/pieces-framework';
import { bindTokenStore } from '../common/client';
import { bettermodeAuth } from '../auth';
import { bettermodeSchemas } from '../common/schemas';
import { memberSpacesDropdown } from '../common/props';
import { createLegacyPost } from './create-post-of-type';

export const createDiscussionAction = createAction({
  name: 'create_discussion',
  classification: 'WRITE',
  auth: bettermodeAuth,
  displayName: 'Create Discussion Post',
  description: 'Create a new discussion post in a space',
  audience: 'human',
  aiMetadata: {
    description:
      'Publishes a new post of the community post type named exactly "Discussion" into a space the connected member has joined. Agents should use List Post Types and Create Post instead. Each call creates a separate post, so retries duplicate.',
    idempotent: false,
  },
  propertyGroups: [
    { key: 'destination', display: 'section', label: 'Post in', icon: 'inbox', props: ['spaceId'] },
    { key: 'post', display: 'section', label: 'Post', icon: 'text', props: ['title', 'content', 'tagNames'] },
  ],
  props: {
    spaceId: memberSpacesDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      placeholder: 'Welcome to the community!',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Plain text or HTML.',
      placeholder: '<p>Share the details here.</p>',
      required: true,
    }),
    tagNames: Property.ShortText({
      displayName: 'Tags',
      description: 'Comma-separated tag names. Leave empty for no tags.',
      placeholder: 'onboarding, feedback',
      required: false,
    }),
    locked: Property.Checkbox({
      displayName: 'Locked',
      description: 'Lock the post so nobody can reply.',
      advanced: true,
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: bettermodeSchemas.legacyPost,
  async run(context) {
    bindTokenStore({ credentials: context.auth.props, store: context.store });
    return createLegacyPost({
      auth: context.auth.props,
      postTypeName: 'Discussion',
      propsValue: context.propsValue,
    });
  },
});
