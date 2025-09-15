import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const addTextBlobAction = createAction({
  name: 'add_text_blob',
  displayName: 'Add Text Blob Into Data Source',
  description: 'Inserts a large text blob into an existing data source',
  props: {
    datasource_id: Property.ShortText({
      displayName: 'Data Source ID',
      description: 'The UUID of the data source',
      required: true,
    }),
    ds_type: Property.StaticDropdown({
      displayName: 'Data Source Type',
      required: true,
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'Document', value: 'doc' },
          { label: 'HTTP', value: 'http' },
          { label: 'Tool', value: 'tool' },
          { label: 'Text Blob', value: 'text_blob' },
          { label: 'Image', value: 'image' },
          { label: 'Text Image', value: 'text_image' },
        ],
      },
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    org_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'The UUID of the organization',
      required: false,
    }),
    text_content: Property.LongText({
      displayName: 'Text Content',
      description: 'The text blob content to insert',
      required: true,
    }),
  },
  async run(context) {
    const {
      datasource_id,
      ds_type,
      name,
      description,
      org_id,
      text_content,
    } = context.propsValue;

    const apiKey = context.auth as string;

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

    return response.body;
  },
});
