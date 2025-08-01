import { createAction, Property } from '@activepieces/pieces-framework';
import { biginAuth } from '../common/auth';
import { BiginClient } from '../common/client';
import { buildSearchCriteria } from '../common/utils';

export const searchPipelineRecordAction = createAction({
  auth: biginAuth,
  name: 'search_pipeline_record',
  displayName: 'Search Pipeline Record',
  description: 'Search for pipeline records (deals) by name',
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Field to search by',
      required: true,
      options: {
        options: [
          { label: 'Deal Name', value: 'Deal_Name' },
          { label: 'Stage', value: 'Stage' },
          { label: 'Amount', value: 'Amount' }
        ]
      }
    }),
    searchValue: Property.ShortText({
      displayName: 'Search Value',
      description: 'Value to search for',
      required: true
    }),
    searchOperator: Property.StaticDropdown({
      displayName: 'Search Operator',
      description: 'How to match the search value',
      required: false,
      defaultValue: 'equals',
      options: {
        options: [
          { label: 'Equals', value: 'equals' },
          { label: 'Contains', value: 'contains' },
          { label: 'Starts With', value: 'starts_with' },
          { label: 'Ends With', value: 'ends_with' }
        ]
      }
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of pipeline records to return (default: 200)',
      required: false,
      defaultValue: 200
    })
  },
  async run(context) {
    const { searchBy, searchValue, searchOperator, limit } = context.propsValue;
    const client = new BiginClient(context.auth);

    try {
      // Build search criteria
      const criteria = buildSearchCriteria(searchBy, searchValue, searchOperator || 'equals');
      
      // Perform search
      const response = await client.searchRecords('Pipelines', criteria, {
        per_page: (limit || 200).toString()
      });

      return {
        success: true,
        data: response.data || [],
        info: response.info || {}
      };
    } catch (error: any) {
      throw new Error(`Failed to search pipeline records: ${error.message}`);
    }
  }
});
