import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const mooninvoiceAuth = PieceAuth.CustomAuth({
  displayName: 'MoonInvoice API Key',
  description: `
# MoonInvoice Authentication

To authenticate with MoonInvoice API, you need:

1. **Email**: Your MoonInvoice account email address
2. **Secret Key**: Your MoonInvoice secret key for API access

## Getting Your Credentials

If you don't have your API credentials yet, please contact us at **support@mooninvoice.com** to get your API secret key or if you have any queries.

## API Documentation

For more information about MoonInvoice API, visit: https://www.mooninvoice.com/docs/api
  `,
  required: true,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Your MoonInvoice account email address',
      required: true,
    }),
    secret_text: Property.ShortText({
      displayName: 'Secret Key',
      description:
        'Your MoonInvoice API secret key (contact support@mooninvoice.com if you need one)',
      required: true,
    }),
  },
});
