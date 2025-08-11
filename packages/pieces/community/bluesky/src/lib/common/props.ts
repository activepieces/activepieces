import { Property } from '@activepieces/pieces-framework';

export const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Italian', value: 'it' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Russian', value: 'ru' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
  { label: 'Chinese (Simplified)', value: 'zh' },
  { label: 'Chinese (Traditional)', value: 'zh-TW' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Norwegian', value: 'no' },
  { label: 'Danish', value: 'da' },
  { label: 'Finnish', value: 'fi' },
  { label: 'Polish', value: 'pl' },
  { label: 'Czech', value: 'cs' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Greek', value: 'el' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Hebrew', value: 'he' },
  { label: 'Thai', value: 'th' },
  { label: 'Vietnamese', value: 'vi' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Malay', value: 'ms' },
  { label: 'Filipino', value: 'fil' },
];


export const languageDropdown = Property.StaticDropdown({
  displayName: 'Language',
  description: 'Select the language for the post',
  required: false,
  options: {
    options: languageOptions,
  },
});

export const multiLanguageDropdown = Property.StaticMultiSelectDropdown({
  displayName: 'Languages',
  description: 'Select one or more languages for the post',
  required: false,
  options: {
    options: languageOptions,
  },
});

export const threadDepthDropdown = Property.StaticDropdown({
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

export const parentHeightDropdown = Property.StaticDropdown({
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

export const visibilityDropdown = Property.StaticDropdown({
  displayName: 'Visibility',
  description: 'Post visibility setting',
  required: false,
  defaultValue: 'public',
  options: {
    options: [
      { label: 'Public', value: 'public' },
      { label: 'Unlisted', value: 'unlisted' },
    ],
  },
});

export const moderationLabelDropdown = Property.StaticMultiSelectDropdown({
  displayName: 'Content Labels',
  description: 'Apply content moderation labels to the post',
  required: false,
  options: {
    options: [
      { label: 'Adult Content', value: 'adult' },
      { label: 'Graphic Media', value: 'graphic-media' },
      { label: 'Nudity', value: 'nudity' },
      { label: 'Sexual', value: 'sexual' },
      { label: 'Violence', value: 'violence' },
      { label: 'Self Harm', value: 'self-harm' },
      { label: 'Spam', value: 'spam' },
      { label: 'Impersonation', value: 'impersonation' },
    ],
  },
});

export const postUrlProperty = Property.ShortText({
  displayName: 'Post URL',
  description: 'Paste the Bluesky post URL (e.g., https://bsky.app/profile/username.bsky.social/post/xxx)',
  required: true,
});

export const userHandleProperty = Property.ShortText({
  displayName: 'User Handle',
  description: 'Bluesky username (e.g., username.bsky.social)',
  required: true,
});

export const authorSelectionProperty = Property.Dropdown({
  displayName: 'Select Author',
  description: 'Choose from accounts you follow',
  required: false,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    try {
      const { createBlueskyAgent } = await import('./client');
      
      const agent = await createBlueskyAgent(auth as any);
      const session = agent.session;
      
      if (!session?.did) {
        return { options: [{ label: 'Please authenticate first', value: '' }] };
      }
      
      const followingResponse = await agent.getFollows({ 
        actor: session.did, 
        limit: 100 
      });
      
      const options = followingResponse.data.follows.map((follow: any) => ({
        label: `${follow.displayName || follow.handle} (@${follow.handle})`,
        value: follow.handle
      }));
      
      options.unshift({ label: 'Enter handle manually', value: 'manual' });
      
      return { options };
    } catch (error) {
      return { 
        options: [{ label: 'Error loading following list', value: '' }] 
      };
    }
  }
});

export const postSearchProperty = Property.ShortText({
  displayName: 'Search Posts',
  description: 'Search for posts by keywords, hashtags, or content',
  required: false,
});

export const postTextProperty = Property.LongText({
  displayName: 'Post Text',
  description: 'What do you want to post? (Max 300 characters)',
  required: true,
});

export const imageUrlsProperty = Property.Array({
  displayName: 'Image URLs',
  description: 'Add up to 4 images by URL',
  required: false,
});

export const imageDescriptionsProperty = Property.Array({
  displayName: 'Image Descriptions',
  description: 'Describe each image for accessibility',
  required: false,
});

export const linkUrlProperty = Property.ShortText({
  displayName: 'Link to Share',
  description: 'URL to share with your post',
  required: false,
});

export const replyToPostProperty = Property.ShortText({
  displayName: 'Reply to Post',
  description: 'URL of post to reply to',
  required: false,
});

export const postTypeDropdown = Property.StaticDropdown({
  displayName: 'Post Type',
  description: 'Type of content you\'re sharing',
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

export const simpleLanguageDropdown = Property.StaticDropdown({
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

export const replyDepthDropdown = Property.StaticDropdown({
  displayName: 'How many replies to show?',
  description: 'Choose how deep to go into the conversation',
  required: false,
  defaultValue: '10',
  options: {
    options: [
      { label: 'Just direct replies (1 level)', value: '1' },
      { label: 'Short conversation (3 levels)', value: '3' },
      { label: 'Full conversation (10 levels)', value: '10' },
      { label: 'Entire thread (50+ levels)', value: '50' },
    ],
  },
});

export const parentPostsDropdown = Property.StaticDropdown({
  displayName: 'Show conversation context?',
  description: 'Include previous posts in the thread for context',
  required: false,
  defaultValue: '3',
  options: {
    options: [
      { label: 'No context - just this post', value: '0' },
      { label: 'Recent context (3 previous posts)', value: '3' },
      { label: 'Full context (10 previous posts)', value: '10' },
      { label: 'Complete thread history', value: '80' },
    ],
  },
});

export const contentWarningDropdown = Property.StaticMultiSelectDropdown({
  displayName: 'Content Warnings',
  description: 'Add warnings for sensitive content',
  required: false,
  options: {
    options: [
      { label: 'Adult Content', value: 'adult' },
      { label: 'Graphic Content', value: 'graphic-media' },
      { label: 'Sensitive Topic', value: 'sensitive' },
      { label: 'Violence', value: 'violence' },
      { label: 'Spam/Promotional', value: 'spam' },
    ],
  },
});

export const audienceDropdown = Property.StaticDropdown({
  displayName: 'Audience',
  description: 'Who can see this post',
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

export function extractPostInfoFromUrl(url: string): { uri?: string; handle?: string; postId?: string } {
  if (url.startsWith('at://')) {
    return { uri: url };
  }
  
  const urlMatch = url.match(/https?:\/\/bsky\.app\/profile\/([^/]+)\/post\/([^/?]+)/);
  if (urlMatch) {
    const handle = urlMatch[1];
    const postId = urlMatch[2];
    
    return {
      handle: handle,
      postId: postId,
    };
  }
  
  return {};
}

export function normalizeHandle(handle: string): string {
  let cleanHandle = handle.replace(/^@/, '');
  
  if (!cleanHandle.includes('.')) {
    cleanHandle += '.bsky.social';
  }
  
  return cleanHandle;
}

export function createSimpleExternalLink(url: string): { uri: string; title: string; description?: string } {
  return {
    uri: url,
    title: url,
    description: 'Shared link'
  };
}


export const postUriProperty = Property.ShortText({
  displayName: 'Post URI (Advanced)',
  description: 'Technical AT-URI format (at://did:plc:xxx/app.bsky.feed.post/xxx) - use Post URL field instead',
  required: false,
});

export const externalLinkProperty = Property.Object({
  displayName: 'External Link (Advanced)',
  description: 'Manual link object - use "Link to Share" field instead',
  required: false,
});

export const replyToProperty = Property.Object({
  displayName: 'Reply To (Advanced)',
  description: 'Manual reply object - use "Reply to Post" field instead',
  required: false,
});



export async function parseBlueskyUrl(url: string, agent: any): Promise<string> {
  if (url.startsWith('at://')) {
    if (!url.match(/^at:\/\/did:plc:[a-z0-9]+\/app\.bsky\.feed\.post\/[a-z0-9]+$/)) {
      throw new Error('Invalid AT-URI format');
    }
    return url;
  }
  
  const urlMatch = url.match(/https?:\/\/bsky\.app\/profile\/([^/]+)\/post\/([^/?]+)/);
  if (urlMatch) {
    const handle = urlMatch[1];
    const postId = urlMatch[2];
    
    if (!handle.includes('.') && !handle.includes('@')) {
      throw new Error('Invalid handle format in URL');
    }
    
    const didDoc = await agent.resolveHandle({ handle: handle.replace('@', '') });
    return `at://${didDoc.data.did}/app.bsky.feed.post/${postId}`;
  }
  
  throw new Error('Invalid post URL format. Please use a valid Bluesky post URL or AT-URI.');
}