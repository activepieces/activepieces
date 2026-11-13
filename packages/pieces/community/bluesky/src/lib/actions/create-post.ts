import { createAction, Property } from '@activepieces/pieces-framework';
import type { AppBskyFeedPost, AtpAgent } from '@atproto/api';
import { blueskyAuth } from '../common/auth';
import { createPostOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyCompose } from '../common/compose';
import { blueskyRefs } from '../common/refs';

export const createPost = createAction({
  auth: blueskyAuth,
  name: 'createPost',
  classification: 'WRITE',
  displayName: 'Create Post',
  description: 'Create a new post on Bluesky',
  audience: 'human',
  outputSchema: createPostOutputSchema,
  aiMetadata: {
    description:
      'Publishes a new post to the authenticated Bluesky account, with optional images, video, an external link card, a quoted post, content-warning labels, and chained thread replies. Use to broadcast content on Bluesky, including threads and video; for a single post prefer Create Post (AI). The post text may be at most 300 visible characters after hashtags are appended, and every thread text is checked before anything is posted. Not idempotent: each call creates a brand-new post.',
    idempotent: false,
  },
  props: {
    postType: blueskyProps.postTypeDropdown,
    text: blueskyProps.postTextProperty,
    language: blueskyProps.simpleLanguageDropdown,
    imageUrls: blueskyProps.imageUrlsProperty,
    imageDescriptions: blueskyProps.imageDescriptionsProperty,
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'Link to a video file (MP4, max 50 MB). Bluesky only accepts videos from accounts with a verified email address.',
      required: false,
    }),
    videoAltText: Property.LongText({
      displayName: 'Video Description',
      description: 'Describe the video for accessibility',
      required: false,
    }),
    videoCaptions: Property.Array({
      displayName: 'Video Captions',
      description: 'Caption file URLs in WebVTT (.vtt) format (optional)',
      required: false,
    }),
    videoCaptionLanguage: Property.ShortText({
      displayName: 'Video Caption Language',
      description: 'Language code of the caption files, for example en or de. Defaults to en.',
      required: false,
      defaultValue: 'en',
    }),
    linkUrl: blueskyProps.linkUrlProperty,
    replyToPost: blueskyProps.replyToPostProperty,
    quotePostUrl: Property.ShortText({
      displayName: 'Quote Post URL',
      description: 'Link or at:// URI of a post to quote (embed) in this post. Works together with images, video or a link.',
      required: false,
    }),
    threadContent: Property.Array({
      displayName: 'Thread Posts',
      description: 'Create additional connected posts. Each must be 300 characters or fewer.',
      required: false,
    }),
    additionalHashtags: Property.ShortText({
      displayName: 'Hashtags',
      description: 'Add hashtags (e.g., tech,bluesky). At most 8.',
      required: false,
    }),
    contentWarnings: blueskyProps.contentWarningDropdown,
    audience: blueskyProps.audienceDropdown,
  },
  async run({ auth, propsValue }) {
    const {
      text,
      language,
      imageUrls,
      imageDescriptions,
      videoUrl,
      videoAltText,
      videoCaptions,
      videoCaptionLanguage,
      linkUrl,
      replyToPost,
      quotePostUrl,
      threadContent,
      additionalHashtags,
      contentWarnings,
    } = propsValue;

    const tags = additionalHashtags ? blueskyCompose.normalizeTags([additionalHashtags]) : [];
    const fullText = tags.length > 0 ? `${text} ${tags.map((tag) => `#${tag}`).join(' ')}` : text;
    blueskyCompose.assertPostLength({ text: fullText, label: 'The post text (including hashtags)' });
    const threadTexts = blueskyCompose.stringList(threadContent);
    threadTexts.forEach((threadText, index) =>
      blueskyCompose.assertPostLength({ text: threadText, label: `Thread post ${index + 1}` }),
    );
    const labels = blueskyCompose.selfLabels(blueskyCompose.mapContentWarnings(contentWarnings ?? []));
    const langs = language && language !== 'other' ? [language] : undefined;
    const images = blueskyCompose.stringList(imageUrls).map((url, index) => ({
      url,
      alt: typeof imageDescriptions?.[index] === 'string' ? String(imageDescriptions[index]) : '',
    }));
    if (images.length > blueskyCompose.MAX_IMAGES) {
      throw new Error(`Bluesky allows at most ${blueskyCompose.MAX_IMAGES} images per post; got ${images.length}.`);
    }

    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'create the post',
      fn: async (agent) => {
        const richText = await blueskyCompose.buildRichText({ agent, text: fullText });
        const reply = replyToPost && replyToPost.trim() ? await blueskyCompose.replyRefs({ agent, input: replyToPost }) : undefined;
        const quote = quotePostUrl && quotePostUrl.trim() ? await blueskyCompose.quoteRef({ agent, input: quotePostUrl }) : undefined;
        const media = await buildMedia({
          agent,
          videoUrl,
          videoAltText,
          captionUrls: blueskyCompose.stringList(videoCaptions),
          captionLanguage: videoCaptionLanguage && videoCaptionLanguage.trim() ? videoCaptionLanguage.trim() : 'en',
          images,
          linkUrl,
        });
        const postRecord: AppBskyFeedPost.Record = {
          $type: 'app.bsky.feed.post',
          text: richText.text,
          facets: richText.facets,
          createdAt: new Date().toISOString(),
          ...(tags.length > 0 ? { tags } : {}),
          ...(labels ? { labels } : {}),
          ...(langs ? { langs } : {}),
          ...(reply ? { reply } : {}),
          ...(quote || media ? { embed: blueskyCompose.combineEmbed({ quote, media }) } : {}),
        };
        const mainPost = await agent.post(postRecord);
        const thread = await postThread({ agent, root: mainPost, texts: threadTexts, langs, labels });
        return {
          success: true,
          mainPost: { uri: mainPost.uri, cid: mainPost.cid },
          url: blueskyRefs.postWebUrl({ uri: mainPost.uri, handle: agent.session?.handle }),
          threadPosts: thread.posted,
          failedThreadPosts: thread.failed,
          totalPosts: 1 + thread.posted.length,
          record: postRecord,
        };
      },
    });
  },
});

async function buildMedia({
  agent,
  videoUrl,
  videoAltText,
  captionUrls,
  captionLanguage,
  images,
  linkUrl,
}: {
  agent: AtpAgent;
  videoUrl: string | undefined;
  videoAltText: string | undefined;
  captionUrls: string[];
  captionLanguage: string;
  images: { url: string; alt: string }[];
  linkUrl: string | undefined;
}) {
  if (videoUrl && videoUrl.trim()) {
    return blueskyCompose.uploadVideo({
      agent,
      url: videoUrl.trim(),
      alt: videoAltText?.trim() || undefined,
      captions: captionUrls.map((url) => ({ url, lang: captionLanguage })),
    });
  }
  if (images.length > 0) {
    return blueskyCompose.uploadImages({ agent, images });
  }
  if (linkUrl && linkUrl.trim()) {
    return blueskyCompose.buildLinkCard({ agent, url: linkUrl.trim() });
  }
  return undefined;
}

async function postThread({
  agent,
  root,
  texts,
  langs,
  labels,
}: {
  agent: AtpAgent;
  root: { uri: string; cid: string };
  texts: string[];
  langs: string[] | undefined;
  labels: AppBskyFeedPost.Record['labels'];
}): Promise<{ posted: { uri: string; cid: string }[]; failed: { index: number; error: string }[] }> {
  const posted: { uri: string; cid: string }[] = [];
  const failed: { index: number; error: string }[] = [];
  let parent = root;
  for (const [index, threadText] of texts.entries()) {
    try {
      const richText = await blueskyCompose.buildRichText({ agent, text: threadText });
      const response = await agent.post({
        text: richText.text,
        facets: richText.facets,
        createdAt: new Date().toISOString(),
        reply: { root: { uri: root.uri, cid: root.cid }, parent: { uri: parent.uri, cid: parent.cid } },
        ...(langs ? { langs } : {}),
        ...(labels ? { labels } : {}),
      });
      posted.push({ uri: response.uri, cid: response.cid });
      parent = response;
    } catch (error) {
      failed.push({ index: index + 1, error: blueskyClient.toBlueskyError({ error, action: `create thread post ${index + 1}` }).message });
    }
  }
  return { posted, failed };
}
