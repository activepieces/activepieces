import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { respaidAuth } from '../..';
import { respaidCommon } from '../common';


export const createNewCampaign = createAction({
  name: 'create_new_campaign',
  displayName: 'Create New Campaign',
  description: 'Action for creating a new campaign.',
  auth: respaidAuth,
  props: {
    campaign_name: Property.ShortText({
      displayName: 'Campaign Name',
      required: true,
    }),
    is_agency_collection: Property.Checkbox({
      displayName: 'Agency collection?',
      required: false,
      defaultValue: false,
    }),
    importData: Property.Json({
      displayName: 'Import Data (Array of Invoices)',
      required: true,
      description: `Provide an array of invoice objects with the following example structure:
      [{
          "unique_identifier": "123",
          "company_name": "Company XYZ",
          "email": "john@example.com",
          "invoice_number": "INV123",
          "invoice_date": "01/01/2025",
          "description": "Invoice for service"
          "due_amount": 1000,
          "invoicing_entity_name": "Creditor ABC",
          "invoicing_entity_address": "456 Avenue, City",
          "full_name": "John Doe",
          "phone_number": "1234567890",
          "address": "123 Street, City",
        }]`,
    }),
  },
  async run({ auth, propsValue }) {
    if (!Array.isArray(propsValue.importData)) {
      throw new Error('Import Data must be an array of objects.');
    }

    const requestBody = {
      campaign_name: propsValue.campaign_name,
      is_agency_collection: propsValue.is_agency_collection,
      import: propsValue.importData.map(invoice => ({
        unique_identifier: invoice.unique_identifier,
        full_name: invoice.full_name,
        company_name: invoice.company_name,
        email: invoice.email,
        phone_number: invoice.phone_number,
        address: invoice.address,
        due_amount: invoice.due_amount,
        invoicing_entity_name: invoice.invoicing_entity_name,
        invoicing_entity_address: invoice.invoicing_entity_address,
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        description: invoice.description,
      })),
    };

    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: `${respaidCommon.baseUrl}/actions/import_campaign`,
      headers: respaidCommon.getHeadersStructure(auth),
      body: ({ type: 'active_pieces', import: JSON.stringify(requestBody) }),
    });
    return res.body;
  },
});
