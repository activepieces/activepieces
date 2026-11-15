import type {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyGraphDefs,
  AppBskyNotificationListNotifications,
} from '@atproto/api';
import { blueskyAtproto } from './atproto';
import { blueskyRefs } from './refs';

function mediaFlags(embed: AppBskyFeedDefs.PostView['embed']): MediaFlags {
  const media = embed && blueskyAtproto.isRecordWithMediaView(embed) ? embed.media : embed;
  return {
    hasImages: media !== undefined && blueskyAtproto.isImagesView(media),
    hasVideo: media !== undefined && blueskyAtproto.isVideoView(media),
    hasExternalLink: media !== undefined && blueskyAtproto.isExternalView(media),
  };
}

function recordText(record: unknown): string {
  if (typeof record === 'object' && record !== null && 'text' in record && typeof record.text === 'string') {
    return record.text;
  }
  return '';
}

function recordReplyParentUri(record: unknown): string | null {
  if (typeof record !== 'object' || record === null || !('reply' in record)) {
    return null;
  }
  const reply: unknown = record.reply;
  if (typeof reply !== 'object' || reply === null || !('parent' in reply)) {
    return null;
  }
  const parent: unknown = reply.parent;
  if (typeof parent === 'object' && parent !== null && 'uri' in parent && typeof parent.uri === 'string') {
    return parent.uri;
  }
  return null;
}

function postBase(post: AppBskyFeedDefs.PostView) {
  return {
    uri: post.uri,
    cid: post.cid,
    url: blueskyRefs.postWebUrl({ uri: post.uri, handle: post.author.handle }),
    author: post.author,
    record: post.record,
    indexedAt: post.indexedAt,
    replyCount: post.replyCount ?? 0,
    repostCount: post.repostCount ?? 0,
    likeCount: post.likeCount ?? 0,
    quoteCount: post.quoteCount ?? 0,
    labels: post.labels ?? [],
    viewer: post.viewer ?? {},
    embed: post.embed ?? null,
  };
}

function feedItem(entry: AppBskyFeedDefs.FeedViewPost) {
  const repost = entry.reason && blueskyAtproto.isReasonRepost(entry.reason) ? entry.reason : undefined;
  return {
    ...postBase(entry.post),
    text: recordText(entry.post.record),
    isRepost: repost !== undefined,
    repostedBy: repost ? repost.by : null,
    repostedAt: repost ? repost.indexedAt : null,
    isReply: recordReplyParentUri(entry.post.record) !== null,
    replyToUri: recordReplyParentUri(entry.post.record),
    isPinned: entry.reason !== undefined && blueskyAtproto.isReasonPin(entry.reason),
  };
}

function profileItem(profile: AppBskyActorDefs.ProfileView | AppBskyActorDefs.ProfileViewDetailed) {
  return {
    did: profile.did,
    handle: profile.handle,
    displayName: profile.displayName ?? '',
    description: profile.description ?? '',
    avatar: profile.avatar ?? '',
    url: blueskyRefs.profileWebUrl(profile.handle === 'handle.invalid' ? profile.did : profile.handle),
    createdAt: profile.createdAt ?? null,
    indexedAt: profile.indexedAt ?? null,
    viewer: profile.viewer ?? {},
    labels: profile.labels ?? [],
  };
}

function detailedProfile(profile: AppBskyActorDefs.ProfileViewDetailed) {
  return {
    ...profileItem(profile),
    banner: profile.banner ?? '',
    followersCount: profile.followersCount ?? 0,
    followsCount: profile.followsCount ?? 0,
    postsCount: profile.postsCount ?? 0,
    pinnedPost: profile.pinnedPost ?? null,
  };
}

function notificationItem(notification: AppBskyNotificationListNotifications.Notification) {
  return {
    uri: notification.uri,
    cid: notification.cid,
    reason: notification.reason,
    reasonSubject: notification.reasonSubject ?? null,
    isRead: notification.isRead,
    indexedAt: notification.indexedAt,
    author: profileItem(notification.author),
    text: recordText(notification.record),
    record: notification.record,
    url: blueskyRefs.parseAtUri(notification.uri)?.collection === blueskyRefs.POST_COLLECTION
      ? blueskyRefs.postWebUrl({ uri: notification.uri, handle: notification.author.handle })
      : '',
  };
}

function listItem(list: AppBskyGraphDefs.ListView) {
  return {
    uri: list.uri,
    cid: list.cid,
    name: list.name,
    purpose: list.purpose,
    description: list.description ?? '',
    avatar: list.avatar ?? '',
    listItemCount: list.listItemCount ?? 0,
    indexedAt: list.indexedAt,
    creator: profileItem(list.creator),
    url: blueskyRefs.postWebUrl({ uri: list.uri, handle: list.creator.handle }),
  };
}

function pageOf<T>({ items, cursor }: { items: T[]; cursor: string | undefined }): { items: T[]; cursor: string | null; hasMore: boolean } {
  return { items, cursor: cursor ?? null, hasMore: Boolean(cursor) };
}

export const blueskyMappers = {
  pageOf,
  mediaFlags,
  recordText,
  recordReplyParentUri,
  postBase,
  feedItem,
  profileItem,
  detailedProfile,
  notificationItem,
  listItem,
};

type MediaFlags = { hasImages: boolean; hasVideo: boolean; hasExternalLink: boolean };
