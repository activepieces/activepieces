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
    importData: Property.Json({
      displayName: 'Import Data (Array of Invoices)',
      required: true,
      description: `Provide an array of invoice objects with the following example structure:
      [{
          "unique_identifier": "123",
          "debtor_full_name": "John Doe",
          "debtor_company_name": "Company XYZ",
          "debtor_email": "john@example.com",
          "debtor_mobile": "1234567890",
          "debtor_address": "123 Street, City",
          "amount_due": 1000,
          "creditor_name": "Creditor ABC",
          "creditor_address": "456 Avenue, City",
          "invoice_number": "INV123",
          "invoice_date": "2025-01-01",
          "description": "Invoice for service"
        }]`,
    }),
  },
  async run({ auth, propsValue }) {
    if (!Array.isArray(propsValue.importData)) {
      throw new Error('Import Data must be an array of objects.');
    }

    const requestBody = {
      campaign_name: propsValue.campaign_name,
      is_agency_collection: true,
      import: propsValue.importData.map(invoice => ({
        unique_identifier: invoice.unique_identifier,
        debtor_full_name: invoice.debtor_full_name,
        debtor_company_name: invoice.debtor_company_name,
        debtor_email: invoice.debtor_email,
        debtor_mobile: invoice.debtor_mobile,
        debtor_address: invoice.debtor_address,
        amount_due: invoice.amount_due,
        creditor_name: invoice.creditor_name,
        creditor_address: invoice.creditor_address,
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
