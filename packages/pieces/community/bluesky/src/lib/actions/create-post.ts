import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { makeBlueskyRequest, getCurrentSession } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { 
  postTextProperty,
  postTypeDropdown,
  simpleLanguageDropdown,
  imageUrlsProperty,
  imageDescriptionsProperty,
  linkUrlProperty,
  replyToPostProperty,
  contentWarningDropdown,
  audienceDropdown,
  createSimpleExternalLink,
  parseReplyInfo
} from '../common/props';

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
    linkUrl: linkUrlProperty,
    replyToPost: replyToPostProperty,
    contentWarnings: contentWarningDropdown,
    audience: audienceDropdown,
  },
  async run({ auth, propsValue }) {
    const { 
      text, 
      language, 
      imageUrls, 
      imageDescriptions, 
      linkUrl, 
      replyToPost, 
      contentWarnings 
    } = propsValue;

    // Validate text length (Bluesky has a 300 character limit)
    if (text.length > 300) {
      throw new Error('Post text cannot exceed 300 characters');
    }

    // Build the post record
    const postRecord: any = {
      $type: 'app.bsky.feed.post',
      text: text,
      createdAt: new Date().toISOString(),
    };

    // Add language if specified (convert from dropdown to array format)
    if (language && language !== 'other') {
      postRecord.langs = [language];
    }

    // Handle reply configuration (user-friendly URL input)
    if (replyToPost && replyToPost.trim()) {
      try {
        const replyInfo = parseReplyInfo(replyToPost);
        if (!replyInfo.uri) {
          throw new Error('Could not parse reply post URL. Please check the URL format.');
        }
        
        // For now, we'll need to implement proper URI resolution
        // This is a simplified implementation
        postRecord.reply = {
          root: {
            uri: replyInfo.uri,
            cid: replyInfo.cid || 'placeholder-cid', // Would need actual CID resolution
          },
          parent: {
            uri: replyInfo.uri,
            cid: replyInfo.cid || 'placeholder-cid',
          },
        };
      } catch (error) {
        throw new Error(`Invalid reply URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }    // Handle embeds (images or external link)
    if (imageUrls && imageUrls.length > 0) {
      if (imageUrls.length > 4) {
        throw new Error('Maximum of 4 images allowed per post');
      }

      const images = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        const altText = imageDescriptions?.[i] || '';

        try {
          // First, fetch the image
          const imageResponse = await fetch(imageUrl as string);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image from ${imageUrl}`);
          }

          const imageBuffer = await imageResponse.arrayBuffer();
          const imageBytes = new Uint8Array(imageBuffer);

          // Check file size (1MB limit)
          if (imageBytes.length > 1000000) {
            throw new Error(`Image at ${imageUrl} is too large (max 1MB)`);
          }

          // Upload the blob
          const blobResponse = await makeBlueskyRequest(
            auth,
            HttpMethod.POST,
            'com.atproto.repo.uploadBlob',
            imageBytes,
            undefined,
            true
          );

          images.push({
            alt: altText,
            image: blobResponse.blob,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          throw new Error(`Failed to upload image ${i + 1}: ${errorMessage}`);
        }
      }

      postRecord.embed = {
        $type: 'app.bsky.embed.images',
        images: images,
      };
    } else if (linkUrl && linkUrl.trim()) {
      // Handle external link (user-friendly URL input)
      try {
        const externalLinkData = createSimpleExternalLink(linkUrl);
        
        postRecord.embed = {
          $type: 'app.bsky.embed.external',
          external: externalLinkData,
        };
      } catch (error) {
        throw new Error(`Failed to process link: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Create the post
    try {
      // Get the current session to access the DID
      const session = await getCurrentSession(auth);
      
      const response = await makeBlueskyRequest(
        auth,
        HttpMethod.POST,
        'com.atproto.repo.createRecord',
        {
          repo: session.did,
          collection: 'app.bsky.feed.post',
          record: postRecord,
        },
        undefined,
        true
      );

      return {
        success: true,
        uri: response.uri,
        cid: response.cid,
        record: postRecord,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create post: ${errorMessage}`);
    }
  },
});
