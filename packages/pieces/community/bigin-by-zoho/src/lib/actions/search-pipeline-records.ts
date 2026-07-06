import { biginAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { biginApiService } from '../common/request';

export const searchPipelineRecord = createAction({
  auth: biginAuth,
  name: 'searchPipelineRecord',
  displayName: 'Search Pipeline Record',
  description: 'Searches deals by name via criteria or word',
  audience: 'both',
  aiMetadata: { description: 'Searches pipeline records (deals) in Bigin CRM and returns matches. Choose between Criteria mode (matches the Deal Name with equals or starts-with) and Word mode (a free-text word search across the module). Use to find a deal by name before referencing or updating it. Idempotent: read-only, repeating the search returns the same matches.', idempotent: true },
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
    const { dealName, mode } = propsValue;

    const { access_token, data } = auth;
    const api_domain = data['api_domain'];

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
