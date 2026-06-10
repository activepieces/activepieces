import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';

const markdown = `
For Sending API key, follow these steps:
1. Navigate to [Domains](https://app.maileroo.com/domains).
2. Click on the domain you want to use.
3. Click on the **Create sending key** under the API section.
4. Click **New Sending Key**.
5. Copy the key under the **Sending Key** column.

For Verification API key, follow these steps:
1. Navigate to [Verification API](https://app.maileroo.com/verifications).
2. Copy the key under the **Verification API** section.
`;

export const mailerooAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdown,
  props: {
    keyType: Property.StaticDropdown({
      displayName: 'Type',
      defaultValue: 'sending',
      options: {
        options: [
          {
            label: 'Sending Key',
            value: 'sending',
          },
          {
            label: 'Verification Key',
            value: 'verification',
          },
        ],
      },
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    // This wont' matter as we are just testing the API key validity
    const PLACEHOLDER_STRING = 'placeholder';

    if (auth.keyType === 'sending') {
      try {
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: 'https://smtp.maileroo.com/api/v2/emails',
          body: {
            from: { address: PLACEHOLDER_STRING },
            to: [{ address: PLACEHOLDER_STRING }],
            subject: PLACEHOLDER_STRING,
            plain: PLACEHOLDER_STRING,
          },
          headers: {
            'X-API-Key': auth.apiKey,
            'Content-Type': 'application/json',
          },
        });
      } catch (e) {
        const status = (e as HttpError).response.status;

        // It is safe to assume that that other 4xx status codes means the API key is valid
        if (status === 401) {
          return {
            valid: false,
            error: 'Invalid API Sending key',
          };
        } else if (status >= 500) {
          return {
            valid: false,
            error: 'An error occurred while validating the API key',
          };
        }
      }

      return {
        valid: true,
      };
    } else {
      const result = await httpClient.sendRequest({
        url: 'https://verify.maileroo.net/check',
        method: HttpMethod.POST,
        body: { email_address: PLACEHOLDER_STRING },
        headers: {
          'X-API-Key': auth.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (result.status === 200 && result.body.error_code !== '0401') {
        return {
          valid: true,
        };
      } else {
        return {
          error: 'Invalid Verification API key',
          valid: false,
        };
      }
    }
  },
});
