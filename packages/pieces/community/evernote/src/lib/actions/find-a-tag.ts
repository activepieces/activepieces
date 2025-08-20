import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

export const findATag = createAction({
  auth: evernoteAuth,
  name: 'find-a-tag',
  displayName: 'Find a Tag',
  description: 'Retrieve a tag by its GUID to get current state and information',
  props: {
    tagGuid: Property.ShortText({
      displayName: 'Tag GUID',
      description: 'The GUID of the tag to retrieve (required)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { access_token } = auth as { access_token: string };
    
    if (!propsValue.tagGuid || propsValue.tagGuid.trim() === '') {
      throw new Error('Tag GUID cannot be empty');
    }

    try {
      // Call Evernote's getTag API to retrieve the tag
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://www.evernote.com/shard/s1/notestore',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'getTag',
          params: [propsValue.tagGuid],
        }),
      });

      if (response.status === 200) {
        const tag = response.body;
        
        return {
          success: true,
          tag: tag,
          message: 'Tag retrieved successfully',
          tagInfo: {
            guid: tag.guid,
            name: tag.name,
            parentGuid: tag.parentGuid || null,
            updateSequenceNum: tag.updateSequenceNum,
            isActive: tag.active !== false,
            hasParent: !!tag.parentGuid,
          },
        };
      } else {
        throw new Error(`Failed to retrieve tag: ${response.status}`);
      }
    } catch (error) {
      // Handle specific Evernote API errors
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('404')) {
          throw new Error(`Tag not found with GUID: ${propsValue.tagGuid}`);
        } else if (error.message.includes('permission') || error.message.includes('403')) {
          throw new Error(`Permission denied: You don't have access to this tag`);
        } else if (error.message.includes('bad data') || error.message.includes('400')) {
          throw new Error(`Invalid tag GUID format: ${propsValue.tagGuid}`);
        }
      }
      
      throw new Error(`Error retrieving tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
