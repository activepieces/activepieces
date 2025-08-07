import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { PaperformSpace, PaperformUpdateSpaceResponse } from '../common/types';
import { paperformCommonProps } from '../common/props';

export const updateSpace = createAction({
  auth: paperformAuth,
  name: 'updateSpace',
  displayName: 'Update Space',
  description: 'Updates an existing space.',
  props: {
    spaceId: paperformCommonProps.spaceId,
    name: Property.ShortText({
      displayName: 'Space Name',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { spaceId, name } = propsValue;

    try {
      const response =
        await paperformCommon.apiCall<PaperformUpdateSpaceResponse>({
          method: HttpMethod.PUT,
          url: `/spaces/${spaceId}`,
          body: {
            name,
          },
          auth: auth as string,
        });

      return response.results.space;
    } catch (error: any) {
      throw new Error(`Failed to update space: ${error.message}`);
    }
  },
});
