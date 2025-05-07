import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { quickbooksAuth } from '../auth';
import { quickbooksCommon } from '../common';
import { QuickbooksEstimate } from '../types';

export const sendEstimate = createAction({
  name: 'send_estimate',
  displayName: 'Send Estimate',
  description: 'Create and send an estimate in QuickBooks',
  auth: quickbooksAuth,
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'The ID of the customer for this estimate',
      required: true,
    }),
    estimate_date: Property.DateTime({
      displayName: 'Estimate Date',
      description: 'The date of the estimate (defaults to today)',
      required: false,
    }),
    expiration_date: Property.DateTime({
      displayName: 'Expiration Date',
      description: 'The expiration date of the estimate',
      required: false,
    }),
    line_items: Property.Array({
      displayName: 'Line Items',
      description: 'The line items for this estimate',
      required: true,
      properties: {
        description: Property.ShortText({
          displayName: 'Description',
          description: 'Description of the item',
          required: true,
        }),
        amount: Property.Number({
          displayName: 'Amount',
          description: 'The amount for this line item',
          required: true,
        }),
        item_id: Property.ShortText({
          displayName: 'Item ID',
          description: 'The ID of the item (optional)',
          required: false,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'The quantity of the item',
          required: false,
          defaultValue: 1,
        }),
      },
    }),
    email_estimate: Property.Checkbox({
      displayName: 'Email Estimate',
      description: 'If checked, the estimate will be emailed to the customer',
      required: false,
      defaultValue: true,
    }),
    memo: Property.LongText({
      displayName: 'Memo',
      description: 'A memo to include on the estimate',
      required: false,
    }),
    custom_email_subject: Property.ShortText({
      displayName: 'Custom Email Subject',
      description: 'Custom subject for the email (if sending)',
      required: false,
    }),
    custom_email_message: Property.LongText({
      displayName: 'Custom Email Message',
      description: 'Custom message for the email (if sending)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      customer_id,
      estimate_date,
      expiration_date,
      line_items,
      email_estimate,
      memo,
      custom_email_subject,
      custom_email_message
    } = propsValue;

    // Format line items for QuickBooks API
    const formattedLineItems = Array.isArray(line_items) ? line_items.map((item: any) => {
      const lineItem: any = {
        DetailType: 'SalesItemLineDetail',
        Amount: item.amount,
        Description: item.description,
        SalesItemLineDetail: {
          Qty: item.quantity || 1,
        },
      };

      if (item.item_id) {
        lineItem.SalesItemLineDetail.ItemRef = {
          value: item.item_id,
        };
      }

      return lineItem;
    }) : [];

    // Create the estimate data
    const estimateData: any = {
      CustomerRef: {
        value: customer_id,
      },
      Line: formattedLineItems,
    };

    if (estimate_date) {
      estimateData.TxnDate = estimate_date;
    }

    if (expiration_date) {
      estimateData.ExpirationDate = expiration_date;
    }

    if (memo) {
      estimateData.PrivateNote = memo;
    }

    // Create the estimate
    const response = await quickbooksCommon.makeRequest<{ Estimate: QuickbooksEstimate }>({
      auth: auth,
      method: HttpMethod.POST,
      path: 'estimate',
      body: estimateData,
    });

    // If email_estimate is true, send the estimate via email
    if (email_estimate && response && response.Estimate && response.Estimate.Id) {
      try {
        const emailData: any = {
          sendTo: response.Estimate.BillEmail?.Address,
        };

        if (custom_email_subject) {
          emailData.subject = custom_email_subject;
        }

        if (custom_email_message) {
          emailData.message = custom_email_message;
        }

        await quickbooksCommon.makeRequest({
          auth: auth,
          method: HttpMethod.POST,
          path: `estimate/${response.Estimate.Id}/send`,
          body: emailData,
        });

        return {
          estimate: response.Estimate,
          email_sent: true,
        };
      } catch (error) {
        return {
          estimate: response.Estimate,
          email_sent: false,
          email_error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    return response;
  },
});
