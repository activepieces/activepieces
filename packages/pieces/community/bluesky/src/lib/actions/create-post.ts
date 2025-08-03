import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { createBlueskyAgent } from '../common/client';
import { RichText } from '@atproto/api';
import { 
  postTextProperty,
  postTypeDropdown,
  simpleLanguageDropdown,
  imageUrlsProperty,
  imageDescriptionsProperty,
  linkUrlProperty,
  replyToPostProperty,
  contentWarningDropdown,
  audienceDropdown
} from '../common/props';

const videoUrlProperty = Property.ShortText({
  displayName: 'Video URL',
  description: 'Link to video file (MP4, max 100MB)',
  required: false,
});

const videoAltTextProperty = Property.LongText({
  displayName: 'Video Description',
  description: 'Describe the video for accessibility',
  required: false,
});

const videoCaptionsProperty = Property.Array({
  displayName: 'Video Captions',
  description: 'Caption file URLs (optional)',
  required: false,
});

const threadContentProperty = Property.Array({
  displayName: 'Thread Posts',
  description: 'Create additional connected posts',
  required: false,
});

const additionalHashtagsProperty = Property.ShortText({
  displayName: 'Hashtags',
  description: 'Add hashtags (e.g., tech,bluesky)',
  required: false,
});

async function parsePostUrl(url: string, agent: any): Promise<string> {
  if (url.startsWith('at://')) {
    return url;
  }
  
  const urlMatch = url.match(/https?:\/\/bsky\.app\/profile\/([^/]+)\/post\/([^/?]+)/);
  if (urlMatch) {
    const handle = urlMatch[1];
    const postId = urlMatch[2];
    
    const didDoc = await agent.resolveHandle({ handle });
    return `at://${didDoc.data.did}/app.bsky.feed.post/${postId}`;
  }
  
  throw new Error('Invalid post URL format. Please use a valid Bluesky post URL.');
}

async function getReplyRefs(postUri: string, agent: any): Promise<any> {
  try {
    const postThread = await agent.getPostThread({ uri: postUri });
    const post = postThread.thread.post;
    
    if (!post) {
      throw new Error('Post not found');
    }
    
    const parentReply = post.record.reply;
    
    return {
      root: parentReply?.root || { uri: post.uri, cid: post.cid },
      parent: { uri: post.uri, cid: post.cid },
    };
  } catch (error) {
    throw new Error(`Failed to resolve reply: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function createEnhancedLinkEmbed(url: string, agent: any): Promise<any> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Activepieces-Bot/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    const titleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"[^>]*>/i) ||
                      html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;
    
    const descMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"[^>]*>/i) ||
                      html.match(/<meta\s+name="description"\s+content="([^"]*)"[^>]*>/i);
    const description = descMatch ? descMatch[1].trim() : '';
    
    const imageMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"[^>]*>/i);
    
    const external: any = {
      uri: url,
      title: title.length > 0 ? title : url,
      description: description.length > 0 ? description : 'Shared link',
    };
    
    if (imageMatch && imageMatch[1]) {
      try {
        let imageUrl = imageMatch[1];
        
        if (imageUrl.startsWith('/')) {
          const urlObj = new URL(url);
          imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
        } else if (!imageUrl.startsWith('http')) {
          imageUrl = new URL(imageUrl, url).href;
        }
        
        const imageResponse = await fetch(imageUrl);
        if (imageResponse.ok) {
          const imageBlob = await imageResponse.blob();
          
          if (imageBlob.size <= 1000000 && imageBlob.type.startsWith('image/')) {
            const thumbResponse = await agent.uploadBlob(imageBlob, {
              encoding: imageBlob.type,
            });
            external.thumb = thumbResponse.data.blob;
          }
        }
      } catch (thumbError) {
        console.warn('Failed to upload link thumbnail:', thumbError);
      }
    }
    
    return {
      $type: 'app.bsky.embed.external',
      external,
    };
  } catch (error) {
    return {
      $type: 'app.bsky.embed.external',
      external: {
        uri: url,
        title: url,
        description: 'Shared link',
      },
    };
  }
}

export const createPost = createAction({
  auth: blueskyAuth,
  name: 'createPost',
  displayName: 'Create Post',
  description: 'Create a new post on Bluesky',
  props: {
    postType: postTypeDropdown,
    text: postTextProperty,
    language: simpleLanguageDropdown,
    imageUrls: imageUrlsProperty,
    imageDescriptions: imageDescriptionsProperty,
    videoUrl: videoUrlProperty,
    videoAltText: videoAltTextProperty,
    videoCaptions: videoCaptionsProperty,
    linkUrl: linkUrlProperty,
    replyToPost: replyToPostProperty,
    threadContent: threadContentProperty,
    additionalHashtags: additionalHashtagsProperty,
    contentWarnings: contentWarningDropdown,
    audience: audienceDropdown,
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
      linkUrl, 
      replyToPost,
      threadContent,
      additionalHashtags,
      contentWarnings,
      audience
    } = propsValue;

    try {
      const agent = await createBlueskyAgent(auth);

      let processedText = text;
      if (additionalHashtags && additionalHashtags.trim()) {
        const hashtags = additionalHashtags
          .split(',')
          .map(tag => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`)
          .filter(tag => tag.length > 1)
          .join(' ');
        
        if (hashtags) {
          processedText += ` ${hashtags}`;
        }
      }

      const richText = new RichText({ text: processedText });
      await richText.detectFacets(agent);

      if (richText.length > 300) {
        throw new Error('Post text cannot exceed 300 characters');
      }

      const postRecord: any = {
        text: richText.text,
        facets: richText.facets,
        createdAt: new Date().toISOString(),
      };

      if (additionalHashtags && additionalHashtags.trim()) {
        const tagList = additionalHashtags
          .split(',')
          .map(tag => tag.trim().replace(/^#/, ''))
          .filter(tag => tag.length > 0);
        
        if (tagList.length > 0) {
          postRecord.tags = tagList;
        }
      }

      if (contentWarnings && contentWarnings.length > 0) {
        postRecord.labels = {
          $type: 'com.atproto.label.defs#selfLabels',
          values: contentWarnings.map((warning: string) => ({ val: warning })),
        };
      }

      if (language && language !== 'other') {
        postRecord.langs = [language];
      }

      if (replyToPost && replyToPost.trim()) {
        const postUri = await parsePostUrl(replyToPost, agent);
        postRecord.reply = await getReplyRefs(postUri, agent);
      }

      if (videoUrl && videoUrl.trim()) {
        try {
          const videoResponse = await fetch(videoUrl);
          if (!videoResponse.ok) {
            throw new Error(`Failed to fetch video from ${videoUrl}`);
          }

          const videoBlob = await videoResponse.blob();
          
          if (!videoBlob.type.startsWith('video/')) {
            throw new Error('File must be a video format');
          }
          
          if (videoBlob.size > 100000000) {
            throw new Error(`Video is too large (max 100MB), got ${Math.round(videoBlob.size / 1000000)}MB`);
          }

          const videoBlobResponse = await agent.uploadBlob(videoBlob, {
            encoding: videoBlob.type,
          });

          const captionObjects = [];
          if (videoCaptions && videoCaptions.length > 0) {
            for (let i = 0; i < videoCaptions.length; i++) {
              const captionUrl = videoCaptions[i] as string;
              try {
                const captionResponse = await fetch(captionUrl);
                if (!captionResponse.ok) continue;
                
                const captionBlob = await captionResponse.blob();
                const captionBlobResponse = await agent.uploadBlob(captionBlob, {
                  encoding: 'text/vtt',
                });

                captionObjects.push({
                  lang: 'en',
                  file: captionBlobResponse.data.blob,
                });
              } catch (error) {
                console.warn(`Failed to upload caption ${i + 1}:`, error);
              }
            }
          }

          const videoEmbed: any = {
            $type: 'app.bsky.embed.video',
            video: videoBlobResponse.data.blob,
          };

          if (videoAltText && videoAltText.trim()) {
            videoEmbed.alt = videoAltText.trim();
          }

          if (captionObjects.length > 0) {
            videoEmbed.captions = captionObjects;
          }

          postRecord.embed = videoEmbed;
        } catch (error) {
          throw new Error(`Failed to process video: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      else if (imageUrls && imageUrls.length > 0) {
        if (imageUrls.length > 4) {
          throw new Error('Maximum of 4 images allowed per post');
        }

        const images = [];
        for (let i = 0; i < imageUrls.length; i++) {
          const imageUrl = imageUrls[i] as string;
          const altText = (imageDescriptions?.[i] as string) || '';

          try {
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
              throw new Error(`Failed to fetch image from ${imageUrl}`);
            }

            const imageBlob = await imageResponse.blob();
            
            if (imageBlob.size > 1000000) {
              throw new Error(`Image at ${imageUrl} is too large (max 1MB)`);
            }

            const blobResponse = await agent.uploadBlob(imageBlob, {
              encoding: imageBlob.type,
            });

            images.push({
              alt: altText,
              image: blobResponse.data.blob,
            });
          } catch (error) {
            throw new Error(`Failed to upload image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        postRecord.embed = {
          $type: 'app.bsky.embed.images',
          images,
        };
      }

      else if (linkUrl && linkUrl.trim()) {
        try {
          const linkEmbed = await createEnhancedLinkEmbed(linkUrl, agent);
          postRecord.embed = linkEmbed;
        } catch (error) {
          console.warn('Failed to fetch link metadata, using basic embed:', error);
          postRecord.embed = {
            $type: 'app.bsky.embed.external',
            external: {
              uri: linkUrl,
              title: linkUrl,
              description: 'Shared link',
            },
          };
        }
      }

      const mainPostResponse = await agent.post(postRecord);
      const createdPosts = [mainPostResponse];

      if (threadContent && threadContent.length > 0) {
        let previousPost = mainPostResponse;
        
        for (let i = 0; i < threadContent.length; i++) {
          const threadText = threadContent[i] as string;
          if (!threadText || !threadText.trim()) continue;

          try {
            const threadRichText = new RichText({ text: threadText });
            await threadRichText.detectFacets(agent);

            if (threadRichText.length > 300) {
              console.warn(`Thread post ${i + 1} exceeds 300 characters, skipping`);
              continue;
            }

            const threadPostRecord: any = {
              text: threadRichText.text,
              facets: threadRichText.facets,
              createdAt: new Date().toISOString(),
              reply: {
                root: { uri: mainPostResponse.uri, cid: mainPostResponse.cid },
                parent: { uri: previousPost.uri, cid: previousPost.cid },
              },
            };

            if (language && language !== 'other') {
              threadPostRecord.langs = [language];
            }
            
            if (contentWarnings && contentWarnings.length > 0) {
              threadPostRecord.labels = {
                $type: 'com.atproto.label.defs#selfLabels',
                values: contentWarnings.map((warning: string) => ({ val: warning })),
              };
            }

            const threadResponse = await agent.post(threadPostRecord);
            createdPosts.push(threadResponse);
            previousPost = threadResponse;

            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (threadError) {
            console.warn(`Failed to create thread post ${i + 1}:`, threadError);
          }
        }
      }

      return {
        success: true,
        mainPost: {
          uri: mainPostResponse.uri,
          cid: mainPostResponse.cid,
        },
        threadPosts: createdPosts.slice(1).map(post => ({
          uri: post.uri,
          cid: post.cid,
        })),
        totalPosts: createdPosts.length,
        record: postRecord,
      };
    } catch (error) {
      throw new Error(`Failed to create post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
