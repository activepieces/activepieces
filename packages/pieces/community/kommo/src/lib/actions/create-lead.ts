import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kommoAuth, getAccessTokenOrThrow, getApiUrl } from '../auth';

export const createLead = createAction({
  name: 'create_lead',
  displayName: 'Create New Lead',
  description: 'Creates a new lead in Kommo',
  auth: kommoAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Lead Name',
      description: 'The name of the lead',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'The price/value of the lead',
      required: false,
    }),
    status_id: Property.Number({
      displayName: 'Status ID',
      description: 'The ID of the pipeline stage',
      required: false,
    }),
    pipeline_id: Property.Number({
      displayName: 'Pipeline ID',
      description: 'The ID of the pipeline',
      required: false,
    }),
    responsible_user_id: Property.Number({
      displayName: 'Responsible User ID',
      description: 'The ID of the user responsible for the lead',
      required: false,
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom fields for the lead as an array of objects with field_id and values',
      required: false,
    }),
    tags: Property.Object({
      displayName: 'Tags',
      description: 'Tags for the lead as an array of objects with name property',
      required: false,
    }),
    contact_id: Property.Number({
      displayName: 'Contact ID',
      description: 'The ID of the contact to link to this lead',
      required: false,
    }),
    company_id: Property.Number({
      displayName: 'Company ID',
      description: 'The ID of the company to link to this lead',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const accessToken = getAccessTokenOrThrow(auth);
    const {
      name,
      price,
      status_id,
      pipeline_id,
      responsible_user_id,
      custom_fields,
      tags,
      contact_id,
      company_id,
    } = propsValue;

    // Prepare lead data
    const leadData: Record<string, any> = {
      name,
    };

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

    // Create the lead
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: getApiUrl(auth, 'leads'),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: [leadData],
    });

    // If a contact or company ID is provided, link them to the lead
    const createdLead = response.body?._embedded?.leads?.[0];

    if (createdLead && (contact_id || company_id)) {
      const leadId = createdLead.id;

      if (contact_id) {
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: getApiUrl(auth, 'leads/link'),
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: {
            to_entity_id: leadId,
            to_entity_type: 'leads',
            from_entity_id: contact_id,
            from_entity_type: 'contacts',
          },
        });
      }

      if (company_id) {
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: getApiUrl(auth, 'leads/link'),
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: {
            to_entity_id: leadId,
            to_entity_type: 'leads',
            from_entity_id: company_id,
            from_entity_type: 'companies',
          },
        });
      }

      // Get the updated lead with linked entities
      const updatedLeadResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: getApiUrl(auth, `leads/${leadId}`),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        queryParams: {
          with: 'contacts,companies',
        },
      });

      return updatedLeadResponse.body;
    }

    return response.body;
  },
});
