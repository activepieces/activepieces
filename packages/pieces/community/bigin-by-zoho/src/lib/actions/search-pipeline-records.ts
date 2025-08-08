import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { biginApiService } from '../common/request';

export const searchPipelineRecord = createAction({
  auth: biginAuth,
  name: 'searchPipelineRecord',
  displayName: 'Search Pipeline Record',
  description: 'Searches for a pipeline record (deal) in Bigin by deal name',
  props: {
    dealName: Property.ShortText({
      displayName: 'Deal Name',
      description: 'Name of the deal to search for',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { dealName } = propsValue;

    const { access_token, api_domain } = auth as any;

    try {
      const response = await biginApiService.searchRecords(
        access_token,
        api_domain,
        'Pipelines',
        {
          key: 'criteria',
          value: `(Deal_Name:equals:${dealName})`,
        }
      );

      return {
        message: 'Pipeline record search completed successfully',
        data: response.data,
      };
    } catch (error: any) {
      throw new Error(`Error searching pipeline record: ${error.message}`);
    }
  },
});
