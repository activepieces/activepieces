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
  audience: 'both',
  aiMetadata: { description: 'Creates a new Paperform space (a workspace/folder for organizing forms) with the given name. Use to set up a new container for forms; each call creates a separate space, so it is not idempotent.', idempotent: false },
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
        auth: auth.secret_text,
      });
      
      return response.results.space;
    } catch (error: any) {
      throw new Error(`Failed to create space: ${error.message}`);
    }
  },
});
