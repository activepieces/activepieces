import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';

export const findForm = createAction({
  auth: paperformAuth,
  name: 'findForm',
  displayName: 'Find Form',
  description: 'Finds a form by title.',
  props: {
    search: Property.ShortText({
      displayName: 'Form Title',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { search } = propsValue;

    try {
      const response = await paperformCommon.getForms({
        auth: auth as string,
        search: search as string,
        limit: 100,
      });

      return {
        found: response.results.forms.length > 0,
        data: response.results.forms,
      };
    } catch (error: any) {
      throw new Error(`Failed to find forms: ${error.message}`);
    }
  },
});
