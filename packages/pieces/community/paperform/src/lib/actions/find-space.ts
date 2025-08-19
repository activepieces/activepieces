import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';

export const findSpace = createAction({
  auth: paperformAuth,
  name: 'findSpace',
  displayName: 'Find Space',
  description: 'Finds a space by name.',
  props: {
    search: Property.ShortText({
      displayName: 'Space Name',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { search } = propsValue;

    try {
      const response = await paperformCommon.getSpaces({
        auth: auth as string,
        search: search as string,
        limit: 100,
      });

      return {
        found: response.results.spaces.length > 0,
        data: response.results.spaces,
      };
    } catch (error: any) {
      throw new Error(`Failed to find spaces: ${error.message}`);
    }
  },
});
