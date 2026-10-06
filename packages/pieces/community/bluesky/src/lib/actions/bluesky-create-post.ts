import { createAction, Property } from '@activepieces/pieces-framework';
import type { AppBskyFeedPost } from '@atproto/api';
import { blueskyAuth } from '../common/auth';
import { aiCreatePostOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyCompose } from '../common/compose';
import { blueskyRefs } from '../common/refs';

export const blueskyCreatePost = createAction({
  auth: blueskyAuth,
  name: 'bluesky_create_post',
  classification: 'WRITE',
  displayName: 'Create Post (AI)',
  description: 'Publish one post with optional reply, quote, images, link card, labels and tags',
  audience: 'ai',
  outputSchema: aiCreatePostOutputSchema,
  aiMetadata: {
    description:
      'Publishes one new post from the connected Bluesky account: text up to 300 visible characters, with an optional reply target, quoted post, up to 4 image URLs with alt text, a link card, self-labels (sexual, nudity, porn, graphic-media), up to 3 language codes and up to 8 tags. Use for a single post or reply; use Delete Post to remove one. Not idempotent: each call creates a new post.',
    idempotent: false,
  },
  props: {
    text: Property.LongText({ displayName: 'Text', description: 'Post text, at most 300 visible characters. Links, @mentions and #hashtags become clickable.', required: true }),
    langs: Property.Array({ displayName: 'Languages', description: 'Up to 3 BCP-47 language codes, for example en or pt-BR.', required: false }),
    replyTo: Property.ShortText({ displayName: 'Reply To', description: 'Link or at:// URI of the post to reply to.', required: false }),
    quote: Property.ShortText({ displayName: 'Quote Post', description: 'Link or at:// URI of a post to quote.', required: false }),
    imageUrls: Property.Array({ displayName: 'Image URLs', description: 'Up to 4 public image URLs (PNG, JPEG, GIF or WebP, max 1 MB each).', required: false }),
    imageAlts: Property.Array({ displayName: 'Image Alt Texts', description: 'Alt text for each image, in the same order.', required: false }),
    linkUrl: Property.ShortText({ displayName: 'Link Card URL', description: 'A URL to show as a link preview card. Ignored when images are given.', required: false }),
    selfLabels: Property.StaticMultiSelectDropdown({
      displayName: 'Content Labels',
      required: false,
      options: {
        options: [
          { label: 'Suggestive (sexual)', value: 'sexual' },
          { label: 'Nudity', value: 'nudity' },
          { label: 'Adult (porn)', value: 'porn' },
          { label: 'Graphic Media', value: 'graphic-media' },
        ],
      },
    }),
    tags: Property.Array({ displayName: 'Tags', description: 'Up to 8 extra hashtags stored on the post without appearing in the text (without #).', required: false }),
  },
  async run({ auth, propsValue }) {
    const text = propsValue.text;
    if (text.trim() === '') {
      throw new Error('Text is empty.');
    }
    blueskyCompose.assertPostLength({ text, label: 'The post text' });
    const langs = blueskyCompose.normalizeLangs(propsValue.langs ?? []);
    const tags = blueskyCompose.normalizeTags(propsValue.tags ?? []);
    const labels = blueskyCompose.selfLabels(blueskyCompose.stringList(propsValue.selfLabels));
    const alts = Array.isArray(propsValue.imageAlts) ? propsValue.imageAlts : [];
    const images = blueskyCompose.stringList(propsValue.imageUrls).map((url, index) => ({
      url,
      alt: typeof alts[index] === 'string' ? String(alts[index]) : '',
    }));
    if (images.length > blueskyCompose.MAX_IMAGES) {
      throw new Error(`Bluesky allows at most ${blueskyCompose.MAX_IMAGES} images per post; got ${images.length}.`);
    }
    if (propsValue.replyTo?.trim()) {
      blueskyRefs.parsePostInput(propsValue.replyTo);
    }
    if (propsValue.quote?.trim()) {
      blueskyRefs.parsePostInput(propsValue.quote);
    }
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'create the post',
      fn: async (agent) => {
        const richText = await blueskyCompose.buildRichText({ agent, text });
        const reply = propsValue.replyTo?.trim() ? await blueskyCompose.replyRefs({ agent, input: propsValue.replyTo }) : undefined;
        const quote = propsValue.quote?.trim() ? await blueskyCompose.quoteRef({ agent, input: propsValue.quote }) : undefined;
        const media =
          images.length > 0
            ? await blueskyCompose.uploadImages({ agent, images })
            : propsValue.linkUrl?.trim()
              ? await blueskyCompose.buildLinkCard({ agent, url: propsValue.linkUrl.trim() })
              : undefined;
        const record: AppBskyFeedPost.Record = {
          $type: 'app.bsky.feed.post',
          text: richText.text,
          facets: richText.facets,
          createdAt: new Date().toISOString(),
          ...(langs.length > 0 ? { langs } : {}),
          ...(tags.length > 0 ? { tags } : {}),
          ...(labels ? { labels } : {}),
          ...(reply ? { reply } : {}),
          ...(quote || media ? { embed: blueskyCompose.combineEmbed({ quote, media }) } : {}),
        };
        const response = await agent.post(record);
        return {
          uri: response.uri,
          cid: response.cid,
          url: blueskyRefs.postWebUrl({ uri: response.uri, handle: agent.session?.handle }),
          isReply: reply !== undefined,
          quotedUri: quote?.uri ?? null,
          createdAt: record.createdAt,
        };
      },
    });
  },
});
