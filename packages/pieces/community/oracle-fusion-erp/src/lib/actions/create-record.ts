import { createAction, Property } from "@activepieces/pieces-framework";
import { oracleFusionAuth } from "../../index";
import { HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";

export const createRecordAction = createAction({
  auth: oracleFusionAuth,
  name: 'create_record',
  displayName: 'Create Record',
  description: 'Creates a new record in a specified business object',
  props: {
    endpoint: Property.ShortText({
      displayName: 'API Endpoint',
      description: 'The resource path (e.g. /fscmRestApi/resources/11.13.18.05/invoices)',
      required: true,
    }),
    data: Property.Json({
      displayName: 'Record Data (JSON)',
      description: 'The JSON body of the record to create',
      required: true,
      defaultValue: { "InvoiceNumber": "INV-001", "Amount": 500 }
    }),
  },
  async run(context) {
    const { base_url, username, password } = context.auth;
    const endpoint = context.propsValue.endpoint;
    
    // Clean the URL
    const cleanBaseUrl = base_url.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${cleanBaseUrl}/${cleanEndpoint}`,
      headers: { 'Content-Type': 'application/json' },
      authentication: {
        type: AuthenticationType.BASIC,
        username: username,
        password: password,
      },
      body: context.propsValue.data,
    });

    return response.body;
  },
});