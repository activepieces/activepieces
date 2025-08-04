import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon, PaperformAuth } from '../auth';
import { paperformApiAuth } from '@activepieces/piece-paperform-api';

export const createSpaceAction = createAction({
  displayName: 'Create Space',
  name: 'create_space',
  description: 'Initialize a new "Space" (workspace) for form management or grouping',
  props: {
    name: Property.ShortText({
      displayName: 'Space Name',
      description: 'The name of the space',
      required: true,
    }),
  },
  auth: paperformApiAuth,
  async run({ auth, propsValue }) {
    const paperformAuth: PaperformAuth = { auth: auth as string };
    
    const endpoint = `/spaces`;
    
    const body = {
      name: propsValue.name,
    };
    
    const response = await paperformCommon.makeRequest(
      paperformAuth, 
      endpoint, 
      HttpMethod.POST,
      body
    );
    
    return {
      success: true,
      message: 'Space created successfully',
      space: response.body,
      name: propsValue.name,
    };
  },
}); 