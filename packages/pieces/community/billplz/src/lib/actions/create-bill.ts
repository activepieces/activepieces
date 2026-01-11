import { 
  createAction, 
  Property, 
} from '@activepieces/pieces-framework';
import { billplzApi } from '../common/api';
import { billplzAuth } from '../common/auth';

export const createBill = createAction({
  name: 'create_bill',
  displayName: 'Create Bill',
  description: 'Create a new bill within a collection',
  auth: billplzAuth,
  props: {
    collection_id: Property.Dropdown({
      displayName: 'Collection',
      description: 'Select the collection to create the bill in',
      required: true,
      refreshers: [],
      auth: billplzAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const response = await billplzApi.getCollections(auth.secret_text);
          const collections = response.body;
          
          return {
            options: collections.map((collection: any) => ({
              label: collection.title || collection.name || collection.id,
              value: collection.id
            }))
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load collections'
          };
        }
      }
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Recipient email address (required if mobile not provided)',
      required: false
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile Number',
      description: 'Recipient mobile number with country code (required if email not provided)',
      required: false
    }),
    name: Property.ShortText({
      displayName: 'Recipient Name',
      description: 'Name of the bill recipient',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount (RM)',
      description: 'Amount in Malaysian Ringgit (e.g., 2.00 for RM 2.00)',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Bill description that will be displayed on the bill',
      required: true,
    }),
    callback_url: Property.ShortText({
      displayName: 'Callback URL',
      description: 'Webhook URL to receive payment completion notifications',
      required: true
    }),
    due_at: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date in YYYY-MM-DD format (optional, defaults to today)',
      required: false
    }),
    redirect_url: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'URL to redirect customer after payment completion',
      required: false
    }),
    deliver: Property.Checkbox({
      displayName: 'Send Email/SMS',
      description: 'Automatically send email and SMS notification to recipient',
      required: false,
      defaultValue: false
    }),
    reference_1_label: Property.ShortText({
      displayName: 'Reference 1 Label',
      description: 'Label for first reference field',
      required: false,
      defaultValue: 'Reference 1',
    }),
    reference_1: Property.ShortText({
      displayName: 'Reference 1 Value',
      description: 'Value for first reference field',
      required: false,
    }),
    reference_2_label: Property.ShortText({
      displayName: 'Reference 2 Label',
      description: 'Label for second reference field',
      required: false,
      defaultValue: 'Reference 2',
    }),
    reference_2: Property.ShortText({
      displayName: 'Reference 2 Value',
      description: 'Value for second reference field',
      required: false,
    })
  },
  async run(context) {
    const { auth, propsValue } = context;
    
    // Convert amount to smallest currency unit (cents)
    const amountInCents = Math.round(propsValue.amount * 100);
    
    // Validate that either email or mobile is provided
    if (!propsValue.email && !propsValue.mobile) {
      throw new Error('Either email or mobile number must be provided');
    }

    const billData = {
      collection_id: propsValue.collection_id,
      email: propsValue.email,
      mobile: propsValue.mobile,
      name: propsValue.name,
      amount: amountInCents,
      description: propsValue.description,
      callback_url: propsValue.callback_url,
      ...(propsValue.due_at && { due_at: propsValue.due_at }),
      ...(propsValue.redirect_url && { redirect_url: propsValue.redirect_url }),
      ...(propsValue.deliver !== undefined && { deliver: propsValue.deliver }),
      ...(propsValue.reference_1_label && { reference_1_label: propsValue.reference_1_label }),
      ...(propsValue.reference_1 && { reference_1: propsValue.reference_1 }),
      ...(propsValue.reference_2_label && { reference_2_label: propsValue.reference_2_label }),
      ...(propsValue.reference_2 && { reference_2: propsValue.reference_2 })
    };

    try {
      const response = await billplzApi.createBill(auth.secret_text, billData);
      return response.body;
    } catch (error: unknown) {
      throw new Error(`Failed to create bill: ${(error as Error).message}`);
    }
  }
});
