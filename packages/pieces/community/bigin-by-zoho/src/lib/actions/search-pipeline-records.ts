import { biginAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { biginApiService } from '../common/request';

export const searchPipelineRecord = createAction({
  auth: biginAuth,
  name: 'searchPipelineRecord',
  displayName: 'Search Pipeline Record',
  description: 'Searches deals by name via criteria or word',
  props: {
    mode: Property.StaticDropdown({
      displayName: 'Search Mode',
      required: true,
      defaultValue: 'criteria',
      options: {
        options: [
          { label: 'Criteria (Deal Name)', value: 'criteria' },
          { label: 'Word', value: 'word' },
        ],
      },
    }),
    dealName: Property.ShortText({
      displayName: 'Search Term',
      description: 'Deal Name (criteria) or word',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { dealName, mode } = propsValue as any;

    const { access_token, api_domain } = auth as any;

    try {
      const response = await biginApiService.searchRecords(
        access_token,
        api_domain,
        'Pipelines',
        mode === 'word' ? { key: 'word', value: dealName } : { key: 'criteria', value: `(Deal_Name:equals:${dealName})OR(Deal_Name:starts_with:${dealName})` }
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
