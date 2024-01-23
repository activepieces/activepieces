// action to return invoices from InvoiceNinja with filtering by invoice status and client id
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { invoiceninjaAuth } from '../..';
export const getInvoices = createAction({
  auth: invoiceninjaAuth,
  name: 'getinvoices_task',
  displayName: 'Get Invoices',
  description: 'Gets data for invoices.',

  props: {
    invoiceStatus: Property.StaticDropdown({
      displayName: 'Invoice Status',
      description: 'Select the invoice status for filtering.',
      required: true,
      options: {
        options: [
          {
            label: 'Unpaid Invoices',
            value: 'unpaid',
          },
          {
            label: 'Paid Invoices',
            value: 'paid',
          },
          {
            label: 'Overdue Invoices',
            value: 'overdue',
          },
          {
            label: 'All Invoices',
            value: 'all',
          },
        ],
      },
    }),
    clientID: Property.LongText({
      displayName: 'Client ID',
      description: 'Filter by Client ID, default is all clients.',
      required: false,
    }),
    numberOfResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of results to return. 9999 is default.',
      required: false,
    }),
  },

  async run(context) {
    const INapiToken = context.auth.access_token;

    const headers = {
      'X-Api-Token': INapiToken,
    };

    const queryParams = new URLSearchParams();
    queryParams.append(
      'client_status',
      context.propsValue.invoiceStatus || 'unpaid'
    );
    // only include client_id in the query parameters if it has been specified
    if (
      context.propsValue.clientID?.valueOf != null ||
      context.propsValue.clientID != undefined
    ) {
      queryParams.append('client_id', context.propsValue.clientID || '');
    }
    queryParams.append('is_deleted', 'false'); // only return invoices that are not deleted
    queryParams.append(
      'per_page',
      context.propsValue.numberOfResults?.toString() || '9999'
    ); // otherwise it only returns 20 per page hopefully

    // Remove trailing slash from base_url
    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    const url = `${baseUrl}/api/v1/invoices/?${queryParams.toString()}`;
    // console.log("INVOICENINJA: " + url);
    const httprequestdata = {
      method: HttpMethod.GET,
      url,
      headers,
    };

    try {
      const response = await httpClient.sendRequest(httprequestdata);
      const my = [];
      // Process the response here (status 2xx).
      if (response.body.meta.pagination.total > 0) {
        // Each invoice that is found will have lots of information, lets remove the guff
        // changed from .total to .count because we're only interested in those in the first page of results which
        // is what we set the per_page to to correspond to the number of records we wanted
        const NumberOfInvoices = response.body.meta.pagination.count;

        for (let i = 0; i < NumberOfInvoices; i++) {
          my.push({
            invoice: {
              clientid: response.body.data[i].client_id,
              invoiceno: response.body.data[i].number,
              ponumber: response.body.data[i].po_number,
              invdate: response.body.data[i].date,
              duedate: response.body.data[i].due_date,
              punote: response.body.data[i].public_notes,
              prnote: response.body.data[i].private_notes,
              reminder1: response.body.data[i].reminder1_sent,
              reminder2: response.body.data[i].reminder2_sent,
              reminder3: response.body.data[i].reminder3_sent,
              lastreminder: response.body.data[i].reminder_last_sent,
              firstsku: response.body.data[i].line_items[0].product_key,
              firstitem: response.body.data[i].line_items[0].notes,
              amount: response.body.data[i].amount,
              balance: response.body.data[i].balance,
              paid: response.body.data[i].paid_to_date,
            },
          });
          // console.log("INVOICENINJA: (" + i.toString() + ") " + response.body.data[i].amount);
        }
        return my;
      } else {
        return false;
      } // this is still returned so if it is false we'll return notfound or similar
    } catch (error) {
      // Handle the error when the request fails (status other than 2xx).
      // console.log((error as Error).message);
      return (error as Error).message;
      //       return "There was a problem getting information from your Invoice Ninja";
    }
  },
});
