import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { apId } from '@activepieces/shared';
import { brexAuth } from '../../';
import { brexCommon, BrexVendor } from '../common';

export const createVendor = createAction({
  auth: brexAuth,
  name: 'create_vendor',
  displayName: 'Create Vendor',
  description:
    'Create a vendor, optionally with US bank (ACH) details so you can pay them with the "Create Transfer" action.',
  props: {
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'The name of the vendor. Must be unique within your account.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: "The vendor's contact email address.",
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: "The vendor's contact phone number.",
      required: false,
    }),
    add_bank_details: Property.Checkbox({
      displayName: 'Add US Bank (ACH) Details',
      description:
        'Turn on to add a US bank account so you can send ACH payments to this vendor.',
      required: false,
      defaultValue: false,
    }),
    routing_number: Property.ShortText({
      displayName: 'Routing Number',
      description: "The vendor's 9-digit US bank routing number. Required if adding bank details.",
      required: false,
    }),
    account_number: Property.ShortText({
      displayName: 'Account Number',
      description: "The vendor's US bank account number. Required if adding bank details.",
      required: false,
    }),
    account_type: Property.StaticDropdown({
      displayName: 'Account Type',
      description: 'The type of US bank account.',
      required: false,
      defaultValue: 'CHECKING',
      options: {
        options: [
          { label: 'Checking', value: 'CHECKING' },
          { label: 'Savings', value: 'SAVINGS' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      company_name,
      email,
      phone,
      add_bank_details,
      routing_number,
      account_number,
      account_type,
    } = context.propsValue;

    if (add_bank_details && (!routing_number || !account_number)) {
      throw new Error(
        'Routing Number and Account Number are required when adding US bank (ACH) details.'
      );
    }

    const body: Record<string, unknown> = {
      company_name,
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
    };

    if (add_bank_details) {
      body['payment_accounts'] = [
        {
          details: {
            type: 'ACH',
            routing_number,
            account_number,
            account_type: account_type ?? 'CHECKING',
          },
        },
      ];
    }

    const response = await brexCommon.apiCall<BrexVendor>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/vendors',
      idempotencyKey: apId(),
      body,
    });
    return brexCommon.flattenVendor(response.body);
  },
});
