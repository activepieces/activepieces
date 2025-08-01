import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon, PaperformAuth } from '../auth';
import { paperformApiAuth } from '@activepieces/piece-paperform-api';

export const findSpaceAction = createAction({
  displayName: 'Find Space',
  name: 'find_space',
  description: 'Retrieve space details by name or ID',
  props: {
    spaceId: Property.ShortText({
      displayName: 'Space ID',
      description: 'The ID of the space to get results for',
      required: true,
    }),
  },
  auth: paperformApiAuth,
  async run({ auth, propsValue }) {
    const paperformAuth: PaperformAuth = { auth: auth as string };
    
    const endpoint = `/spaces/${propsValue.spaceId}`;
    const response = await paperformCommon.makeRequest(
      paperformAuth, 
      endpoint, 
      HttpMethod.GET
    );
    
    return {
      success: true,
      message: 'Space retrieved successfully',
      space: response.body,
      spaceId: propsValue.spaceId,
    };
  },
}); 