import { AppBskyEmbedImages, AppBskyFeedDefs, RichText } from '@atproto/api';
import { describe, expect, it } from 'vitest';
import { blueskyAtproto } from '../src/lib/common/atproto';

describe('lazy atproto helpers', () => {
  it('counts graphemes exactly like the SDK RichText', () => {
    const samples = ['hello', '日本語のテキスト', '👍'.repeat(5), '👨‍👩‍👧‍👦 family', '🇯🇵🇺🇸 flags', 'é combining', '', 'mixed 😀 text with 🏳️‍🌈 and 각'];
    for (const text of samples) {
      expect(blueskyAtproto.graphemeLength(text), text).toBe(new RichText({ text }).graphemeLength);
    }
  });

  it('matches the SDK type guards', () => {
    const values: unknown[] = [
      { $type: 'app.bsky.feed.defs#reasonRepost', by: {}, indexedAt: '' },
      { $type: 'app.bsky.feed.defs#reasonPin' },
      { $type: 'app.bsky.feed.defs#threadViewPost', post: {} },
      { $type: 'app.bsky.feed.defs#notFoundPost', uri: '', notFound: true },
      { $type: 'app.bsky.feed.defs#blockedPost', uri: '', blocked: true },
      { $type: 'app.bsky.embed.images#view', images: [] },
      { $type: 'app.bsky.embed.video#view' },
      { $type: 'app.bsky.embed.external#view' },
      { $type: 'app.bsky.embed.recordWithMedia#view' },
      { $type: 'something.else' },
      {},
      null,
      'text',
    ];
    for (const value of values) {
      expect(blueskyAtproto.isReasonRepost(value)).toBe(AppBskyFeedDefs.isReasonRepost(value));
      expect(blueskyAtproto.isReasonPin(value)).toBe(AppBskyFeedDefs.isReasonPin(value));
      expect(blueskyAtproto.isThreadViewPost(value)).toBe(AppBskyFeedDefs.isThreadViewPost(value));
      expect(blueskyAtproto.isNotFoundPost(value)).toBe(AppBskyFeedDefs.isNotFoundPost(value));
      expect(blueskyAtproto.isBlockedPost(value)).toBe(AppBskyFeedDefs.isBlockedPost(value));
      expect(blueskyAtproto.isImagesView(value)).toBe(AppBskyEmbedImages.isView(value));
    }
  });

  it('loads the SDK on first use and reuses it', async () => {
    const first = await blueskyAtproto.load();
    const second = await blueskyAtproto.load();
    expect(first).toBe(second);
    expect(typeof first.AtpAgent).toBe('function');
  });
});
