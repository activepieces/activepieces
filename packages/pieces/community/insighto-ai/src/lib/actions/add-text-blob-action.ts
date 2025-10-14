import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DataSourceItemSchema, DataSourceItem } from '../schemas';

export const addTextBlobAction = createAction({
  name: 'add_text_blob',
  displayName: 'Add Text Blob Into Data Source',
  description: 'Inserts a large text blob into an existing data source',
  props: {
    datasource_id: Property.Dropdown({
      displayName: 'Data Source',
      description: 'Select the data source to add the text blob to',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const apiKey = auth as string;
          const url = `https://api.insighto.ai/api/v1/datasource`;

          const queryParams: Record<string, string> = {
            api_key: apiKey,
            page: '1',
            size: '100', // Get more data sources for better UX
          };

          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            queryParams,
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const data = response.body.data;
          if (!data || !data.items) {
            return {
              disabled: true,
              options: [],
              placeholder: 'No data sources found'
            };
          }

          // Validate the response data
          const validatedItems: DataSourceItem[] = [];
          for (const item of data.items) {
            try {
              const parsedItem = DataSourceItemSchema.parse(item);
              validatedItems.push(parsedItem);
            } catch {
              continue;
            }
          }

          const options = validatedItems.map((item) => ({
            label: `${item.name || 'Unnamed'} (${item.ds_type})`,
            value: JSON.stringify({ id: item.id, ds_type: item.ds_type }),
          }));

          return {
            disabled: false,
            options,
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load data sources'
          };
        }
      },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Optional name for this text blob entry',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional description of what this text blob contains',
      required: false,
    }),
    org_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The UUID of the organization',
      required: false,
    }),
    text_content: Property.LongText({
      displayName: 'Text Content',
      description: 'The text content to add to the data source',
      required: true,
    }),
  },
  async run(context) {
    try {
      const datasourceSelection = context.propsValue['datasource_id'];
      const name = context.propsValue['name'];
      const description = context.propsValue['description'];
      const org_id = context.propsValue['org_id'];
      const text_content = context.propsValue['text_content'];

      const apiKey = context.auth as string;

      let datasource_id: string;
      let ds_type: string;

      try {
        const parsed = JSON.parse(datasourceSelection);
        datasource_id = parsed.id;
        ds_type = parsed.ds_type;
      } catch {
        throw new Error('Invalid data source selection. Please select a valid data source from the dropdown.');
      }

      const url = `https://api.insighto.ai/api/v1/datasource/${datasource_id}/text_blob`;

      const queryParams: Record<string, string> = {
        api_key: apiKey,
        ds_type,
      };

      if (name) queryParams['name'] = name;
      if (description) queryParams['description'] = description;
      if (org_id) queryParams['org_id'] = org_id;

      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url,
        queryParams,
        body: {
          content: text_content,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.body) {
        throw new Error('No response received from Insighto.ai API');
      }

      return response.body;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to add text blob: ${error.message}`);
      }
      throw new Error('Failed to add text blob to data source');
    }
  },
});
