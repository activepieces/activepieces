import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { evernoteAuth } from '../../index';

export const createTag = createAction({
  auth: evernoteAuth,
  name: 'create-tag',
  displayName: 'Create Tag',
  description: 'Create a new tag in Evernote',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to create',
      required: true,
    }),
    parentGuid: Property.ShortText({
      displayName: 'Parent Tag GUID',
      description: 'The GUID of the parent tag for hierarchical organization (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { apiKey, accessToken, noteStoreUrl } = auth as { 
      apiKey: string; 
      accessToken: string; 
      noteStoreUrl: string; 
    };
    
    if (!propsValue.name || propsValue.name.trim() === '') {
      throw new Error('Tag name cannot be empty');
    }

    // Prepare the tag object according to Evernote's API structure
    const tagData: any = {
      name: propsValue.name,
      updateSequenceNum: 0,
    };

    if (propsValue.parentGuid) {
      tagData.parentGuid = propsValue.parentGuid;
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: noteStoreUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `OAuth oauth_consumer_key="${apiKey}", oauth_token="${accessToken}"`,
          'User-Agent': 'ActivePieces-Evernote-Integration/1.0',
        },
        body: JSON.stringify({
          method: 'createTag',
          params: [tagData],
        }),
      });

      if (response.status === 200) {
        return {
          success: true,
          tag: response.body,
          message: 'Tag created successfully',
        };
      } else {
        throw new Error(`Failed to create tag: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`Error creating tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
