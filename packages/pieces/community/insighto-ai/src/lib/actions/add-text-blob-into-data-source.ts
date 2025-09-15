import { createAction, Property } from '@activepieces/pieces-framework';
import { DatasourceDropdown } from '../common/dropdown';
import { InsightoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';


export const addTextBlobIntoDataSource = createAction({
  auth: InsightoAuth,
  name: 'addTextBlobIntoDataSource',
  displayName: 'Add Text Blob Into Data Source',
  description: 'Add a text blob into a specified data source in Insighto AI',
  props: {
    datasourceId: DatasourceDropdown,
    datasourceType: Property.StaticDropdown({
      displayName: "Data Source Type",
      description: "Select the type of data source",
      required: true,
      options: {
        disabled: false,
        options: [
          { label: "PDF", value: "pdf" },
          { label: "DOC", value: "doc" },
          { label: "HTTP", value: "http" },
          { label: "Tool", value: "tool" },
          { label: "Text Blob", value: "text_blob" },
          { label: "Image", value: "image" },
          { label: "Text + Image", value: "text_image" },
        ],
      },
    }),
    name: Property.ShortText({
      displayName: "Name (optional)",
      description: "Name of the text blob",
      required: false,
    }),
    description: Property.LongText({
      displayName: "Description (optional)",
      description: "Description of the text blob",
      required: false,
    }),
    orgId: Property.ShortText({
      displayName: "Organization ID (optional)",
      description: "Organization ID if needed",
      required: false,
    }),
    attributes: Property.Json({
      displayName: "Attributes / Content",
      description: "The text blob content or other attributes required in body",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
   const { datasourceId, datasourceType, name, description, orgId, attributes } = propsValue;

    const params: Record<string, unknown> = {
      ds_type: datasourceType,
    };
    if (name) params['name'] = name;
    if (description) params['description'] = description;
    if (orgId) params['org_id'] = orgId;

    const path = `/datasource/${datasourceId}/text_blob`;

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      path,
      {
        ...attributes,
      }
    );

    return response;
  },
});
