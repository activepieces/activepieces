import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

export const findATag = createAction({
  auth: evernoteAuth,
  name: 'find-a-tag',
  displayName: 'Find a Tag',
  description: 'Find a tag by name in Evernote',
  props: {
    tagName: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to find (required)',
      required: true,
    }),
    includeInactive: Property.Checkbox({
      displayName: 'Include Inactive Tags',
      description: 'Whether to include inactive tags in the search (default: false)',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { apiKey, accessToken, noteStoreUrl } = auth as { 
      apiKey: string; 
      accessToken: string; 
      noteStoreUrl: string; 
    };
    
    if (!propsValue.tagName || propsValue.tagName.trim() === '') {
      throw new Error('Tag name cannot be empty');
    }

    try {
      // Call Evernote's findTags API to search for the tag
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: noteStoreUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `OAuth oauth_consumer_key="${apiKey}", oauth_token="${accessToken}"`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'findTags',
          params: [propsValue.tagName, propsValue.includeInactive || false],
        }),
      });

      if (response.status === 200) {
        const tags = response.body || [];
        
        // Filter tags by name (case-insensitive)
        const matchingTags = tags.filter((tag: any) => 
          tag.name && tag.name.toLowerCase().includes(propsValue.tagName.toLowerCase())
        );

        if (matchingTags.length === 0) {
          return {
            success: true,
            found: false,
            message: `No tags found matching "${propsValue.tagName}"`,
            searchTerm: propsValue.tagName,
            totalTagsSearched: tags.length,
          };
        }

        // Return the first matching tag with detailed information
        const foundTag = matchingTags[0];
        const tagInfo = {
          guid: foundTag.guid,
          name: foundTag.name,
          parentGuid: foundTag.parentGuid || null,
          updateSequenceNum: foundTag.updateSequenceNum || 0,
          isActive: foundTag.active !== false,
          hasParent: !!foundTag.parentGuid,
        };

        return {
          success: true,
          found: true,
          tag: foundTag,
          tagInfo: tagInfo,
          message: `Tag "${foundTag.name}" found successfully`,
          searchTerm: propsValue.tagName,
          totalMatches: matchingTags.length,
          totalTagsSearched: tags.length,
        };
      } else {
        throw new Error(`Failed to search for tags: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Error searching for tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
