// 2026-11-16 +03: kwtSMS connection (API username + password); validated with POST /API/balance/.
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { callKwtsms } from './common';

export const kwtsmsAuth = PieceAuth.CustomAuth({
  description: `Use your **API** username and password, not your website login.
1. Sign in to [kwtSMS](https://www.kwtsms.com).
2. Open the **API** page in your account and enable API access.
3. Copy the API username and API password.`,
  props: {
    username: Property.ShortText({
      displayName: 'API Username',
      required: true,
    }),
    password: PieceAuth.SecretText({
      displayName: 'API Password',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await callKwtsms('balance', auth);
      return { valid: true };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  },
  required: true,
});
