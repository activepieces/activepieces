import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth, BlueSkyAuthType } from '../common/auth';
import { createBlueskyAgent } from '../common/client';
import { parseBlueskyUrl } from '../common/props';



export const repostPost = createAction({
  auth: blueskyAuth,
  name: 'repostPost',
  displayName: 'Repost Post',
  description: 'Share someone else\'s post to your timeline',
  props: {
    selectionMethod: Property.StaticDropdown({
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
    }),
    
    postSelection: Property.Dropdown({
      displayName: 'Select Post',
      description: 'Choose from your recent timeline posts (only when "From my timeline" is selected above)',
      required: false,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        try {
          const agent = await createBlueskyAgent(auth as BlueSkyAuthType);
          const timeline = await agent.getTimeline({ limit: 50 });
          
          return {
            options: timeline.data.feed.map(item => ({
              label: `@${item.post.author.handle}: ${item.post.record['text'] ? String(item.post.record['text']).substring(0, 80) : 'Media post'}${String(item.post.record['text'] || '').length > 80 ? '...' : ''} (${new Date(item.post.indexedAt).toLocaleDateString()})`,
              value: item.post.uri
            }))
          };
        } catch (error) {
          return { 
            options: [{ label: 'Error loading posts', value: '' }] 
          };
        }
      }
    }),

    postUrl: Property.ShortText({
      displayName: 'Post URL',
      description: 'Paste the Bluesky post URL',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { selectionMethod, postSelection, postUrl } = propsValue;

    let postUri: string;
    
    if (selectionMethod === 'timeline') {
      if (!postSelection) {
        throw new Error('Please select a post from your timeline dropdown');
      }
      postUri = postSelection as string;
    } else if (selectionMethod === 'manual') {
      if (!postUrl || !postUrl.trim()) {
        throw new Error('Post URL is required when using manual entry method');
      }
      
      try {
        const agent = await createBlueskyAgent(auth);
        postUri = await parseBlueskyUrl(postUrl.trim(), agent);
      } catch (error) {
        throw new Error(`Invalid post URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      throw new Error('Please select a post selection method');
    }

    try {
      const agent = await createBlueskyAgent(auth);
      
      const postsResponse = await agent.getPosts({ uris: [postUri] });
      
      if (!postsResponse.data.posts || postsResponse.data.posts.length === 0) {
        throw new Error('Post not found');
      }
      
      const post = postsResponse.data.posts[0];
      
      const response = await agent.repost(postUri, post.cid);

      return {
        success: true,
        repostUri: response.uri,
        repostCid: response.cid,
        originalPost: {
          uri: postUri,
          cid: post.cid,
          author: post.author.handle,
          text: post.record['text'] ? String(post.record['text']).substring(0, 100) + (String(post.record['text']).length > 100 ? '...' : '') : 'No text available',
          createdAt: post.record['createdAt'] || post.indexedAt,
        },
        selectionMethod: selectionMethod,
        repostedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Post not found')) {
          throw new Error('Post not found. Please check the URL and try again.');
        }
        if (error.message.includes('Invalid post URL format')) {
          throw new Error('Invalid post URL format. Please use a valid Bluesky post URL or AT-URI.');
        }
        if (error.message.includes('Authentication')) {
          throw new Error('Authentication failed. Please check your credentials.');
        }
        throw new Error(`Failed to repost: ${error.message}`);
      }
      throw new Error('Failed to repost: Unknown error occurred');
    }
  },
});