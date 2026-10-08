import { PieceAuth } from '@activepieces/pieces-framework';
import { payrollClient } from './common/client';

export const employmentHeroPayrollAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Connect an Employment Hero Payroll Australia account, formerly KeyPay.\n1. Sign in to Payroll and click your name, then **My Account**.\n2. Choose **Generate API Key** and copy the key here.\n3. Ensure that account has access to the businesses you want to use.\n\nEmployment Hero HR uses a different API and is not supported by this piece.',
  required: true,
  validate: async ({ auth }) => {
    if (!auth.trim())
      return { valid: false, error: 'Enter your Payroll API key.' };
    try {
      await payrollClient.request({ apiKey: auth, path: '/user' });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unable to validate the Payroll API key.',
      };
    }
  },
});
