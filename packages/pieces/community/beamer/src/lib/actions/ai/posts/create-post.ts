import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerClient } from '../../../common/client';
import { beamerUtils } from '../../../common/utils';
import { beamerCreatePostOutputSchema } from '../../../output-schemas';

export const createPostAiAction = createAction({
  auth: beamerAuth,
  name: 'beamer_create_post',
  outputSchema: beamerCreatePostOutputSchema,
  displayName: 'Create Post',
  description: 'Creates an announcement post in Beamer, published or as a draft.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a Beamer changelog post with a title, content and category. Set Publish to "false" to save a draft that users do not see; Update Post can publish it later. Creates a new post on every call.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({ displayName: 'Title', description: 'Title of the post.', required: true }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Body of the post. Basic HTML is allowed.',
      required: true,
    }),
    category: beamerAiProps.category({ required: true }),
    publish: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Publish',
      description: '"true" publishes the post to your feed now, "false" saves it as a draft.',
    }),
    archive: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Archive',
      description: '"true" archives the post.',
    }),
    showInWidget: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Show In Widget',
      description: 'Whether the post shows in the embedded feed.',
    }),
    showInStandalone: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Show In Standalone',
      description: 'Whether the post shows in the standalone feed page.',
    }),
    linkUrl: Property.ShortText({
      displayName: 'Link URL',
      description: 'URL users go to when they click the post title or its link.',
      required: false,
    }),
    linkText: Property.ShortText({
      displayName: 'Link Text',
      description: 'Text of the link shown at the bottom of the post.',
      required: false,
    }),
    linksInNewWindow: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Open Links In New Window',
      description: 'Whether links in the post open in a new tab.',
    }),
    date: Property.ShortText({
      displayName: 'Publication Date',
      description: 'Publication date in ISO-8601 format, e.g. "2026-01-31T00:00:00Z". Defaults to now.',
      required: false,
    }),
    enableSocialShare: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Enable Social Share',
      description: 'Whether users can share the post on social media.',
    }),
    userEmail: Property.ShortText({
      displayName: 'Author Email',
      description: 'Email of the Beamer team member shown as the author.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    beamerUtils.checkCategory({ category: propsValue.category });
    return await beamerClient.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: '/posts',
      body: {
        title: [propsValue.title],
        content: [propsValue.content],
        category: propsValue.category,
        publish: beamerUtils.toBoolean({ value: propsValue.publish, propName: 'publish' }),
        archive: beamerUtils.toBoolean({ value: propsValue.archive, propName: 'archive' }),
        showInWidget: beamerUtils.toBoolean({ value: propsValue.showInWidget, propName: 'showInWidget' }),
        showInStandalone: beamerUtils.toBoolean({ value: propsValue.showInStandalone, propName: 'showInStandalone' }),
        linkUrl: propsValue.linkUrl === undefined ? undefined : [propsValue.linkUrl],
        linkText: propsValue.linkText === undefined ? undefined : [propsValue.linkText],
        linksInNewWindow: beamerUtils.toBoolean({ value: propsValue.linksInNewWindow, propName: 'linksInNewWindow' }),
        date: propsValue.date,
        enableSocialShare: beamerUtils.toBoolean({ value: propsValue.enableSocialShare, propName: 'enableSocialShare' }),
        userEmail: propsValue.userEmail,
      },
    });
  },
});
