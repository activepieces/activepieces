import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerApi } from '../../../common/api';
import { beamerClient } from '../../../common/client';
import type { BeamerPost } from '../../../common/types';
import { beamerUtils } from '../../../common/utils';
import { beamerCreatePostOutputSchema } from '../../../output-schemas';

export const updatePostAction = createAction({
  auth: beamerAuth,
  name: 'beamer_update_post',
  outputSchema: beamerCreatePostOutputSchema,
  displayName: 'Update Post',
  description: 'Updates a Beamer post. Only the fields you set change.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a Beamer post and keeps the rest, e.g. publish a draft (Publish "true"), archive it, or edit its title or content. Get the ID from List Posts or Create Post.',
    idempotent: true,
  },
  props: {
    postId: beamerAiProps.postId({ required: true }),
    title: Property.ShortText({ displayName: 'Title', description: 'New title of the post.', required: false }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'New body of the post. Basic HTML is allowed.',
      required: false,
    }),
    category: beamerAiProps.category({ required: false }),
    publish: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Publish',
      description: '"true" publishes the post, "false" turns it back into a draft.',
    }),
    archive: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Archive',
      description: '"true" archives the post, "false" unarchives it.',
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
      description: 'New URL users go to when they click the post title or its link.',
      required: false,
    }),
    linkText: Property.ShortText({
      displayName: 'Link Text',
      description: 'New text of the link shown at the bottom of the post.',
      required: false,
    }),
    linksInNewWindow: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Open Links In New Window',
      description: 'Whether links in the post open in a new tab.',
    }),
    date: Property.ShortText({
      displayName: 'Publication Date',
      description: 'New publication date in ISO-8601 format, e.g. "2026-01-31T00:00:00Z".',
      required: false,
    }),
    enableSocialShare: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Enable Social Share',
      description: 'Whether users can share the post on social media.',
    }),
  },
  async run({ auth, propsValue }) {
    beamerUtils.checkCategory({ category: propsValue.category });
    const current = await beamerApi.getPost({ auth, postId: propsValue.postId });
    const translation = current.translations?.[0] ?? {};
    const linkUrl = propsValue.linkUrl ?? translation.linkUrl;
    const linkText = propsValue.linkText ?? translation.linkText;
    return await beamerClient.request<BeamerPost>({
      auth,
      method: HttpMethod.PUT,
      path: `/posts/${encodeURIComponent(propsValue.postId)}`,
      body: {
        title: [propsValue.title ?? translation.title ?? ''],
        content: [propsValue.content ?? translation.contentHtml ?? translation.content ?? ''],
        linkUrl: linkUrl === undefined ? undefined : [linkUrl],
        linkText: linkText === undefined ? undefined : [linkText],
        category: propsValue.category,
        publish: beamerUtils.toBoolean({ value: propsValue.publish, propName: 'publish' }),
        archive: beamerUtils.toBoolean({ value: propsValue.archive, propName: 'archive' }),
        showInWidget: beamerUtils.toBoolean({ value: propsValue.showInWidget, propName: 'showInWidget' }),
        showInStandalone: beamerUtils.toBoolean({ value: propsValue.showInStandalone, propName: 'showInStandalone' }),
        linksInNewWindow: beamerUtils.toBoolean({ value: propsValue.linksInNewWindow, propName: 'linksInNewWindow' }),
        date: propsValue.date,
        enableSocialShare: beamerUtils.toBoolean({ value: propsValue.enableSocialShare, propName: 'enableSocialShare' }),
      },
    });
  },
});
