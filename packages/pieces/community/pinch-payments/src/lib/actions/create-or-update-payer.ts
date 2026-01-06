import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { createOrUpdatePayer, listPayers } from '../common/client';

export const createOrUpdatePayerAction = createAction({
  auth: pinchPaymentsAuth,
  name: 'create_or_update_payer',
  displayName: 'Create or Update Payer',
  description: 'Create a new payer or update an existing one',
  props: {
    payerId: Property.Dropdown({
      displayName: 'Payer',
      description: 'Select an existing payer to update, or leave empty to create a new one',
      required: false,
      auth: pinchPaymentsAuth,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }

        const credentials = auth.props as { username: string; password: string };
        const response = await listPayers(credentials, { pageSize: 500 });

        return {
          disabled: false,
          options: response.data.map((payer: { id: string; firstName: string; lastName: string; emailAddress: string }) => ({
            label: `${payer.firstName} ${payer.lastName || ''} (${payer.emailAddress})`.trim(),
            value: payer.id,
          })),
        };
      },
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the payer',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the payer',
      required: false,
    }),
    emailAddress: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the payer',
      required: true,
    }),
    mobileNumber: Property.ShortText({
      displayName: 'Mobile Number',
      description: 'Mobile phone number',
      required: false,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name',
      required: false,
    }),
    companyRegistrationNumber: Property.ShortText({
      displayName: 'Company Registration Number',
      description: 'Company registration number (ABN, etc.)',
      required: false,
    }),
    streetAddress: Property.ShortText({
      displayName: 'Street Address',
      description: 'Street address',
      required: false,
    }),
    suburb: Property.ShortText({
      displayName: 'Suburb',
      description: 'Suburb or city',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'State or territory',
      required: false,
    }),
    postcode: Property.ShortText({
      displayName: 'Postcode',
      description: 'Postal code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country',
      required: false,
    }),
    metadata: Property.ShortText({
      displayName: 'Metadata',
      description: 'Custom metadata for the payer',
      required: false,
    }),
    addPaymentSource: Property.Checkbox({
      displayName: 'Add Payment Source',
      description: 'Add a payment source (bank account or credit card) to this payer',
      required: false,
      defaultValue: false,
    }),
    sourceType: Property.StaticDropdown({
      displayName: 'Source Type',
      description: 'Type of payment source',
      required: false,
      options: {
        options: [
          { label: 'Bank Account', value: 'bank-account' },
          { label: 'Credit Card', value: 'credit-card' },
        ],
      },
    }),
    sourceToken: Property.ShortText({
      displayName: 'Source Token',
      description: 'The token created by the Pinch capture script',
      required: false,
    }),
    ipAddress: Property.ShortText({
      displayName: 'IP Address',
      description: 'IP address of the payer (for payment source)',
      required: false,
    }),
  },
  async run(context) {
    const {
      payerId,
      firstName,
      lastName,
      emailAddress,
      mobileNumber,
      companyName,
      companyRegistrationNumber,
      streetAddress,
      suburb,
      state,
      postcode,
      country,
      metadata,
      addPaymentSource,
      sourceType,
      sourceToken,
      ipAddress,
    } = context.propsValue;

    const payerData: Record<string, unknown> = {
      firstName,
      emailAddress,
    };

    if (payerId) payerData['id'] = payerId;
    if (lastName) payerData['lastName'] = lastName;
    if (mobileNumber) payerData['mobileNumber'] = mobileNumber;
    if (companyName) payerData['companyName'] = companyName;
    if (companyRegistrationNumber) payerData['companyRegistrationNumber'] = companyRegistrationNumber;
    if (streetAddress) payerData['streetAddress'] = streetAddress;
    if (suburb) payerData['suburb'] = suburb;
    if (state) payerData['state'] = state;
    if (postcode) payerData['postcode'] = postcode;
    if (country) payerData['country'] = country;
    if (metadata) payerData['metadata'] = metadata;

    if (addPaymentSource && sourceType && sourceToken) {
      payerData['source'] = {
        sourceType,
        token: sourceToken,
        ...(ipAddress && { ipAddress }),
      };
    }

    return await createOrUpdatePayer(
      {
        username: context.auth.props.username,
        password: context.auth.props.password,
      },
      payerData as any
    );
  },
});
