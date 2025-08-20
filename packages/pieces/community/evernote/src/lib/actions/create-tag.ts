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
      description: 'The GUID of the parent tag (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { access_token } = auth as { access_token: string };
    
    // Prepare the tag object according to Evernote's API structure
    const tagData: any = {
      name: propsValue.name,
      guid: '', // Will be assigned by the server
      updateSequenceNum: 0,
    };

    if (propsValue.parentGuid) {
      tagData.parentGuid = propsValue.parentGuid;
    }

    try {
      // Evernote uses a custom API structure for creating tags
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://www.evernote.com/shard/s1/notestore',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
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
