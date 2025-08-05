import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { PaperformCreateSpaceResponse } from '../common/types';

export const createSpace = createAction({
  auth: paperformAuth,
  name: 'createSpace',
  displayName: 'Create Space',
  description: 'Creates a new space.',
  props: {
    name: Property.ShortText({
      displayName: 'Space Name',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { name } = propsValue;
    
    try {
      const response = await paperformCommon.apiCall<PaperformCreateSpaceResponse>({
        method: HttpMethod.POST,
        url: '/spaces',
        body: {
          name,
        },
        auth: auth as string,
      });
      
      return response.results.space;
    } catch (error: any) {
      throw new Error(`Failed to create space: ${error.message}`);
    }
  },
});
