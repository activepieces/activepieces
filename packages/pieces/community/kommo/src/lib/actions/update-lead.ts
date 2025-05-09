import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kommoAuth, getAccessTokenOrThrow, getApiUrl } from '../auth';

export const updateLead = createAction({
  name: 'update_lead',
  displayName: 'Update Lead',
  description: 'Updates an existing lead in Kommo',
  auth: kommoAuth,
  props: {
    lead_id: Property.Number({
      displayName: 'Lead ID',
      description: 'The ID of the lead to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Lead Name',
      description: 'The new name of the lead',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'The new price/value of the lead',
      required: false,
    }),
    status_id: Property.Number({
      displayName: 'Status ID',
      description: 'The new ID of the pipeline stage',
      required: false,
    }),
    pipeline_id: Property.Number({
      displayName: 'Pipeline ID',
      description: 'The new ID of the pipeline',
      required: false,
    }),
    responsible_user_id: Property.Number({
      displayName: 'Responsible User ID',
      description: 'The new ID of the user responsible for the lead',
      required: false,
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom fields to update for the lead as an array of objects with field_id and values',
      required: false,
    }),
    tags: Property.Object({
      displayName: 'Tags',
      description: 'Tags to update for the lead as an array of objects with name property',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const accessToken = getAccessTokenOrThrow(auth);
    const {
      lead_id,
      name,
      price,
      status_id,
      pipeline_id,
      responsible_user_id,
      custom_fields,
      tags,
    } = propsValue;

    // Prepare lead data
    const leadData: Record<string, any> = {
      id: lead_id,
    };

    if (name !== undefined) leadData.name = name;
    if (price !== undefined) leadData.price = price;
    if (status_id !== undefined) leadData.status_id = status_id;
    if (pipeline_id !== undefined) leadData.pipeline_id = pipeline_id;
    if (responsible_user_id !== undefined) leadData.responsible_user_id = responsible_user_id;

    // Add custom fields if provided
    if (custom_fields && typeof custom_fields === 'object') {
      leadData.custom_fields_values = custom_fields;
    }

    // Add tags if provided
    if (tags && typeof tags === 'object') {
      leadData._embedded = {
        tags: tags,
      };
    }

    // Update the lead
    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: getApiUrl(auth, `leads/${lead_id}`),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: leadData,
    });

    // Get the updated lead with all details
    const updatedLeadResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(auth, `leads/${lead_id}`),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      queryParams: {
        with: 'contacts,companies',
      },
    });

    return updatedLeadResponse.body;
  },
});
