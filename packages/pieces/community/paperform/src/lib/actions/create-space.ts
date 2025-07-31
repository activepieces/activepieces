import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createSpace = createAction({
  auth: paperformAuth,
  name: 'createSpace',
  displayName: 'Create Space',
  description: 'Create a new space for form management or grouping.',
  props: {
    name: Property.ShortText({
      displayName: 'Space Name',
      description: 'The name of the space (required)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { name } = propsValue;
    
    try {
      const response = await paperformCommon.apiCall({
        method: HttpMethod.POST,
        url: '/spaces',
        body: {
          name,
        },
        auth: auth as string,
      });
      
      return {
        success: true,
        message: `Space "${name}" has been successfully created.`,
        space: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to create space: ${error.message}`);
    }
  },
});
