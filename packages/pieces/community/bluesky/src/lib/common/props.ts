import { Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from './auth';
import { blueskyClient } from './client';

const MAX_DROPDOWN_FOLLOWS = 1000;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

const threadDepthDropdown = Property.StaticDropdown({
  displayName: 'Thread Depth',
  description: 'How many levels deep to retrieve replies',
  required: false,
  defaultValue: '10',
  options: {
    options: [
      { label: '1 level', value: '1' },
      { label: '2 levels', value: '2' },
      { label: '3 levels', value: '3' },
      { label: '5 levels', value: '5' },
      { label: '10 levels', value: '10' },
      { label: '20 levels', value: '20' },
      { label: '50 levels', value: '50' },
      { label: '100 levels (max)', value: '100' },
    ],
  },
});

const parentHeightDropdown = Property.StaticDropdown({
  displayName: 'Parent Height',
  description: 'How many parent posts to retrieve',
  required: false,
  defaultValue: '3',
  options: {
    options: [
      { label: 'No parents', value: '0' },
      { label: '1 parent', value: '1' },
      { label: '2 parents', value: '2' },
      { label: '3 parents', value: '3' },
      { label: '5 parents', value: '5' },
      { label: '10 parents', value: '10' },
      { label: '20 parents', value: '20' },
      { label: 'All parents (80 max)', value: '80' },
    ],
  },
});

const postUrlProperty = Property.ShortText({
  displayName: 'Post URL',
  description: 'Paste the Bluesky post URL (e.g., https://bsky.app/profile/username.bsky.social/post/xxx)',
  required: true,
});

const postTextProperty = Property.LongText({
  displayName: 'Post Text',
  description: 'What do you want to post? (Max 300 characters, counted as visible characters so emoji and non-Latin text count once each)',
  required: true,
});

const imageUrlsProperty = Property.Array({
  displayName: 'Image URLs',
  description: 'Add up to 4 images by URL (PNG, JPEG, GIF or WebP, max 1 MB each)',
  required: false,
});

const imageDescriptionsProperty = Property.Array({
  displayName: 'Image Descriptions',
  description: 'Describe each image for accessibility',
  required: false,
});

const linkUrlProperty = Property.ShortText({
  displayName: 'Link to Share',
  description: 'URL to share with your post',
  required: false,
});

const replyToPostProperty = Property.ShortText({
  displayName: 'Reply to Post',
  description: 'URL of post to reply to',
  required: false,
});

const postTypeDropdown = Property.StaticDropdown({
  displayName: 'Post Type',
  description: 'Informational only. To quote a post, fill in "Quote Post URL"; to reply, fill in "Reply to Post".',
  required: false,
  defaultValue: 'text',
  options: {
    options: [
      { label: 'Text Post', value: 'text' },
      { label: 'Photo Post', value: 'photo' },
      { label: 'Link Share', value: 'link' },
      { label: 'Reply', value: 'reply' },
      { label: 'Repost with Comment', value: 'quote' },
    ],
  },
});

const simpleLanguageDropdown = Property.StaticDropdown({
  displayName: 'Post Language',
  description: 'Language of your post',
  required: false,
  defaultValue: 'en',
  options: {
    options: [
      { label: 'English', value: 'en' },
      { label: 'Spanish', value: 'es' },
      { label: 'French', value: 'fr' },
      { label: 'German', value: 'de' },
      { label: 'Italian', value: 'it' },
      { label: 'Portuguese', value: 'pt' },
      { label: 'Japanese', value: 'ja' },
      { label: 'Korean', value: 'ko' },
      { label: 'Chinese', value: 'zh' },
      { label: 'Russian', value: 'ru' },
      { label: 'Arabic', value: 'ar' },
      { label: 'Hindi', value: 'hi' },
      { label: 'Dutch', value: 'nl' },
      { label: 'Swedish', value: 'sv' },
      { label: 'Other', value: 'other' },
    ],
  },
});

const contentWarningDropdown = Property.StaticMultiSelectDropdown({
  displayName: 'Content Warnings',
  description:
    'Self-labels Bluesky shows as content warnings. "Adult Content" is sent as Bluesky\'s Adult (porn) label, "Violence" as Graphic Media, "Sensitive Topic" as Suggestive (sexual); "Spam/Promotional" has no Bluesky label and is ignored.',
  required: false,
  options: {
    options: [
      { label: 'Adult Content', value: 'adult' },
      { label: 'Graphic Content', value: 'graphic-media' },
      { label: 'Sensitive Topic', value: 'sensitive' },
      { label: 'Violence', value: 'violence' },
      { label: 'Spam/Promotional', value: 'spam' },
      { label: 'Suggestive (sexual)', value: 'sexual' },
      { label: 'Nudity', value: 'nudity' },
      { label: 'Adult (porn)', value: 'porn' },
    ],
  },
});

const audienceDropdown = Property.StaticDropdown({
  displayName: 'Audience',
  description: 'Bluesky posts are always public; this setting has no effect and is kept only for older flows.',
  required: false,
  defaultValue: 'public',
  options: {
    options: [
      { label: 'Everyone (Public)', value: 'public' },
      { label: 'Followers only', value: 'followers' },
      { label: 'Private/Unlisted', value: 'unlisted' },
    ],
  },
});

function limitProperty({ description }: { description?: string } = {}) {
  return Property.Number({
    displayName: 'Limit',
    description: description ?? `How many results to return per page (1-${MAX_LIMIT}, default ${DEFAULT_LIMIT}).`,
    required: false,
    defaultValue: DEFAULT_LIMIT,
  });
}

function cursorProperty() {
  return Property.ShortText({
    displayName: 'Cursor',
    description: 'Leave empty for the first page. To get the next page, pass the "cursor" value returned by the previous run.',
    required: false,
  });
}

function actorProperty({ description }: { description: string }) {
  return Property.ShortText({ displayName: 'Account', description, required: true });
}

function optionalActorProperty({ description }: { description: string }) {
  return Property.ShortText({ displayName: 'Account', description, required: false });
}

function postInputProperty() {
  return Property.ShortText({
    displayName: 'Post',
    description: 'The post link (https://bsky.app/profile/alice.bsky.social/post/3k...) or its at:// URI.',
    required: true,
  });
}

function listInputProperty() {
  return Property.ShortText({
    displayName: 'List',
    description: 'The list link (https://bsky.app/profile/alice.bsky.social/lists/3k...) or its at:// URI.',
    required: true,
  });
}

const NOTIFICATION_REASONS = [
  { label: 'Like', value: 'like' },
  { label: 'Repost', value: 'repost' },
  { label: 'Follow', value: 'follow' },
  { label: 'Mention', value: 'mention' },
  { label: 'Reply', value: 'reply' },
  { label: 'Quote', value: 'quote' },
  { label: 'Joined via your starter pack', value: 'starterpack-joined' },
  { label: 'Like of your repost', value: 'like-via-repost' },
  { label: 'Repost of your repost', value: 'repost-via-repost' },
  { label: 'Post from an account you subscribed to', value: 'subscribed-post' },
  { label: 'Verified', value: 'verified' },
  { label: 'Verification removed', value: 'unverified' },
];

function notificationReasonsProperty({ defaultValue, description }: { defaultValue?: string[]; description: string }) {
  return Property.StaticMultiSelectDropdown({
    displayName: 'Notification Types',
    description,
    required: false,
    defaultValue,
    options: { options: NOTIFICATION_REASONS },
  });
}

const selectionMethodDropdown = Property.StaticDropdown({
  displayName: 'Select Method',
  description: 'How to choose the post',
  required: true,
  defaultValue: 'timeline',
  options: {
    options: [
      { label: 'From my timeline', value: 'timeline' },
      { label: 'Enter URL manually', value: 'manual' },
    ],
  },
});

function selectedPostInput({
  selectionMethod,
  postSelection,
  postUrl,
}: {
  selectionMethod: unknown;
  postSelection: unknown;
  postUrl: unknown;
}): string {
  if (selectionMethod === 'timeline') {
    if (typeof postSelection !== 'string' || postSelection.trim() === '') {
      throw new Error('Please select a post from your timeline dropdown');
    }
    return postSelection.trim();
  }
  if (selectionMethod === 'manual') {
    if (typeof postUrl !== 'string' || postUrl.trim() === '') {
      throw new Error('Post URL is required when using manual entry method');
    }
    return postUrl.trim();
  }
  throw new Error('Please select a post selection method');
}

function parseLimit(raw: unknown): number {
  if (raw === undefined || raw === null || raw === '') {
    return DEFAULT_LIMIT;
  }
  const value = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > MAX_LIMIT) {
    throw new Error(`Limit must be a whole number between 1 and ${MAX_LIMIT}; got ${String(raw)}.`);
  }
  return value;
}

function parseCursor(raw: unknown): string | undefined {
  return typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : undefined;
}

function postLabel({ handle, text, indexedAt }: { handle: string; text: unknown; indexedAt: string }): string {
  const body = typeof text === 'string' && text !== '' ? text : 'Media post';
  const trimmed = body.length > 80 ? `${body.substring(0, 80)}...` : body;
  return `@${handle}: ${trimmed} (${new Date(indexedAt).toLocaleDateString()})`;
}

function timelinePostDropdown() {
  return Property.Dropdown({
    auth: blueskyAuth,
    displayName: 'Select Post',
    description: 'Choose from your 50 most recent timeline posts (only when "From my timeline" is selected above)',
    required: false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Bluesky account first' };
      }
      try {
        const agent = await blueskyClient.createAgent(auth.props);
        const timeline = await agent.getTimeline({ limit: 50 });
        return {
          disabled: false,
          options: timeline.data.feed.map((item) => ({
            label: postLabel({ handle: item.post.author.handle, text: item.post.record['text'], indexedAt: item.post.indexedAt }),
            value: item.post.uri,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: `Could not load your timeline: ${error instanceof Error ? error.message : 'unknown error'}`,
        };
      }
    },
  });
}

function followingDropdown() {
  return Property.Dropdown({
    auth: blueskyAuth,
    displayName: 'Select Author',
    description: 'Choose from accounts you follow',
    required: false,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Connect your Bluesky account first' };
      }
      try {
        const agent = await blueskyClient.createAgent(auth.props);
        const did = blueskyClient.sessionDid(agent);
        const options: { label: string; value: string }[] = [];
        let cursor: string | undefined = undefined;
        do {
          const page: Awaited<ReturnType<typeof agent.getFollows>> = await agent.getFollows({ actor: did, limit: 100, cursor });
          options.push(
            ...page.data.follows.map((follow) => ({
              label: `${follow.displayName || follow.handle} (@${follow.handle})`,
              value: follow.handle,
            })),
          );
          cursor = page.data.cursor && page.data.cursor !== cursor ? page.data.cursor : undefined;
        } while (cursor && options.length < MAX_DROPDOWN_FOLLOWS);
        if (options.length === 0) {
          return { disabled: true, options: [], placeholder: 'You do not follow anyone yet. Use "Enter handle manually" instead.' };
        }
        return { disabled: false, options };
      } catch (error) {
        return {
          disabled: true,
          options: [],
          placeholder: `Could not load the accounts you follow: ${error instanceof Error ? error.message : 'unknown error'}`,
        };
      }
    },
  });
}

export const blueskyProps = {
  MAX_LIMIT,
  DEFAULT_LIMIT,
  threadDepthDropdown,
  parentHeightDropdown,
  postUrlProperty,
  postTextProperty,
  imageUrlsProperty,
  imageDescriptionsProperty,
  linkUrlProperty,
  replyToPostProperty,
  postTypeDropdown,
  simpleLanguageDropdown,
  contentWarningDropdown,
  audienceDropdown,
  limitProperty,
  cursorProperty,
  actorProperty,
  optionalActorProperty,
  postInputProperty,
  listInputProperty,
  timelinePostDropdown,
  followingDropdown,
  selectionMethodDropdown,
  selectedPostInput,
  notificationReasonsProperty,
  parseLimit,
  parseCursor,
};
