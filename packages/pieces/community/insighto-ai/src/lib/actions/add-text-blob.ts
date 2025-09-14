import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { insightoAiAuth } from '../common/auth';

interface DataSource {
  id: string;
  name: string;
}

export const addTextBlobToDataSource = createAction({
  auth: insightoAiAuth,
  name: 'add_text_blob_to_data_source',
  displayName: 'Add Text Blob Into Data Source',
  description: 'Inserts a large text blob into an existing data source.',
  props: {
    dataSourceId: Property.Dropdown({
      displayName: 'Data Source',
      description: 'Select the data source to add the text to.',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Insighto.ai account first.',
            options: [],
          };
        }
        const response = await httpClient.sendRequest<{
          data: { items: DataSource[] };
        }>({
          method: HttpMethod.GET,
          url: 'https://api.insighto.ai/v1/datasource',
          headers: { Authorization: `Bearer ${auth as string}` },
        });
        return {
          disabled: false,
          options: response.body.data.items.map((ds) => ({
            label: ds.name,
            value: ds.id,
          })),
        };
      },
    }),
    text_content: Property.LongText({
      displayName: 'Text Content',
      description: 'The text blob to add to the data source.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Optional: A name for this text blob file.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Optional: A description for this text blob file.',
      required: false,
    }),
  },
  async run(context) {
    const { dataSourceId, text_content, name, description } =
      context.propsValue;

    const queryParams: Record<string, string> = {
      ds_type: 'text_blob', 
    };
    if (name) {
      queryParams['name'] = name;
    }
    if (description) {
      queryParams['description'] = description;
    }

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.insighto.ai/v1/datasource/${dataSourceId}/text_blob`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
      },
      queryParams: queryParams,
      body: {
        content: text_content,
      },
    });
  },
});
