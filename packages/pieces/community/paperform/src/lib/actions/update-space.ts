import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { PaperformSpace } from '../common/types';

export const updateSpace = createAction({
  auth: paperformAuth,
  name: 'updateSpace',
  displayName: 'Update Space',
  description: 'Modify space settings and metadata.',
  props: {
    spaceId: Property.Dropdown({
      displayName: 'Space',
      description: 'Select the space to update',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        
        try {
          const spaces = await paperformCommon.getSpaces({
            auth: auth as string,
            limit: 100,
          });
          
          return {
            disabled: false,
            options: spaces.results.spaces.map((space: PaperformSpace) => ({
              label: space.name,
              value: space.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading spaces',
            options: [],
          };
        }
      },
    }),
    name: Property.ShortText({
      displayName: 'Space Name',
      description: 'The new name for the space',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { spaceId, name } = propsValue;
    
    try {
      const response = await paperformCommon.apiCall({
        method: HttpMethod.PUT,
        url: `/spaces/${spaceId}`,
        body: {
          name,
        },
        auth: auth as string,
      });
      
      return {
        success: true,
        message: `Space has been successfully updated to "${name}".`,
        space: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to update space: ${error.message}`);
    }
  },
});
