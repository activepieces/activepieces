import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon, PaperformAuth } from '../auth';
import { paperformApiAuth } from '@activepieces/piece-paperform-api';

export const updateSpaceAction = createAction({
  displayName: 'Update Space',
  name: 'update_space',
  description: 'Modify space settings and metadata',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The ID of the space to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Space Name',
      description: 'The name of the space',
      required: false,
    }),
  },
  auth: paperformApiAuth,
  async run({ auth, propsValue }) {
    const paperformAuth: PaperformAuth = { auth: auth as string };
    
    const endpoint = `/spaces/${propsValue.spaceId}`;
    
    // Build request body with only provided values
    const body: any = {};
    
    if (propsValue.name) {
      body.name = propsValue.name;
    }
    
    const response = await paperformCommon.makeRequest(
      paperformAuth, 
      endpoint, 
      HttpMethod.PUT,
      body
    );
    
    return {
      success: true,
      message: 'Space updated successfully',
      space: response.body,
      spaceId: propsValue.spaceId,
    };
  },
}); 