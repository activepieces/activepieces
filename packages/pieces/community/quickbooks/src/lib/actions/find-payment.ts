import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../auth';
import { quickbooksCommon } from '../common';

export const findPayment = createAction({
  name: 'find_payment',
  displayName: 'Find Payment',
  description: 'Find a payment in QuickBooks',
  auth: quickbooksAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search for payments by customer name, payment number, or other fields',
      required: false,
    }),
    payment_id: Property.ShortText({
      displayName: 'Payment ID',
      description: 'The ID of the specific payment to retrieve',
      required: false,
    }),
    invoice_id: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'Find payments for a specific invoice',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Maximum Results',
      description: 'Maximum number of results to return (default: 10, max: 1000)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ auth, propsValue }) {
    const { query, payment_id, invoice_id, max_results } = propsValue;

    // If payment_id is provided, get that specific payment
    if (payment_id) {
      return await quickbooksCommon.makeRequest({
        auth: auth,
        method: HttpMethod.GET,
        path: `payment/${payment_id}`,
      });
    }

    // Build the query string
    let queryString = '';

    if (query) {
      queryString = `${query}`;
    }

    if (invoice_id) {
      if (queryString) queryString += ' AND ';
      // This is a simplified query - in reality, you'd need to join with line items
      queryString += `Id IN (SELECT Payment.Id FROM Payment JOIN PaymentLine ON Payment.Id = PaymentLine.PaymentId WHERE PaymentLine.LinkedTxn.TxnId = '${invoice_id}')`;
    }

    // Make the request to search for payments
    return await quickbooksCommon.makeRequest({
      auth: auth,
      method: HttpMethod.GET,
      path: 'query',
      query: {
        query: `SELECT * FROM Payment ${queryString ? 'WHERE ' + queryString : ''} MAXRESULTS ${max_results || 10}`,
      },
    });
  },
});
