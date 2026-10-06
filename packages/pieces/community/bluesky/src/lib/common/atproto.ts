import type * as Atproto from '@atproto/api';
import type {
  $Typed,
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedVideo,
  AppBskyFeedDefs,
} from '@atproto/api';

let atprotoModule: Promise<typeof Atproto> | undefined;

function load(): Promise<typeof Atproto> {
  if (atprotoModule === undefined) {
    atprotoModule = import('@atproto/api').catch((error: unknown) => {
      atprotoModule = undefined;
      throw error;
    });
  }
  return atprotoModule;
}

const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

function graphemeLength(text: string): number {
  let count = 0;
  for (const segment of graphemeSegmenter.segment(text)) {
    if (segment.segment !== '') {
      count++;
    }
  }
  return count;
}

function typeOf(value: unknown): string | undefined {
  if (typeof value === 'object' && value !== null && '$type' in value && typeof value.$type === 'string') {
    return value.$type;
  }
  return undefined;
}

function isReasonRepost(value: unknown): value is $Typed<AppBskyFeedDefs.ReasonRepost> {
  return typeOf(value) === 'app.bsky.feed.defs#reasonRepost';
}

function isReasonPin(value: unknown): value is $Typed<AppBskyFeedDefs.ReasonPin> {
  return typeOf(value) === 'app.bsky.feed.defs#reasonPin';
}

function isThreadViewPost(value: unknown): value is $Typed<AppBskyFeedDefs.ThreadViewPost> {
  return typeOf(value) === 'app.bsky.feed.defs#threadViewPost';
}

function isNotFoundPost(value: unknown): value is $Typed<AppBskyFeedDefs.NotFoundPost> {
  return typeOf(value) === 'app.bsky.feed.defs#notFoundPost';
}

function isBlockedPost(value: unknown): value is $Typed<AppBskyFeedDefs.BlockedPost> {
  return typeOf(value) === 'app.bsky.feed.defs#blockedPost';
}

function isRecordWithMediaView(value: unknown): value is $Typed<AppBskyEmbedRecordWithMedia.View> {
  return typeOf(value) === 'app.bsky.embed.recordWithMedia#view';
}

function isImagesView(value: unknown): value is $Typed<AppBskyEmbedImages.View> {
  return typeOf(value) === 'app.bsky.embed.images#view';
}

function isVideoView(value: unknown): value is $Typed<AppBskyEmbedVideo.View> {
  return typeOf(value) === 'app.bsky.embed.video#view';
}

function isExternalView(value: unknown): value is $Typed<AppBskyEmbedExternal.View> {
  return typeOf(value) === 'app.bsky.embed.external#view';
}

export const blueskyAtproto = {
  load,
  graphemeLength,
  typeOf,
  isReasonRepost,
  isReasonPin,
  isThreadViewPost,
  isNotFoundPost,
  isBlockedPost,
  isRecordWithMediaView,
  isImagesView,
  isVideoView,
  isExternalView,
};
