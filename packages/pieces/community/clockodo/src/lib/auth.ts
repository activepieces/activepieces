import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { ClockodoClient, ClockodoError } from './common/client';


export const clockodoAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    email: Property.ShortText({
      displayName: 'E-Mail',
      required: true,
      description: 'The email of your clockodo user',
    }),
    token: PieceAuth.SecretText({
      displayName: 'API-Token',
      description: 'Your api token (can be found in profile settings)',
      required: true,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Your company name or app name',
      required: true,
    }),
    company_email: Property.ShortText({
      displayName: 'Company E-Mail',
      description: 'A contact email for your company or app',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const identification = auth.company_name.trim() + ';' + auth.company_email.trim();
    if (identification.length > MAX_IDENTIFICATION_LENGTH) {
      return {
        valid: false,
        error: `Company Name and Company E-Mail together must be at most ${MAX_IDENTIFICATION_LENGTH} characters including the separating semicolon (Clockodo limit).`,
      };
    }
    try {
      await new ClockodoClient({
        email: auth.email,
        token: auth.token,
        clientName: auth.company_name,
        clientEmail: auth.company_email,
      }).getCurrentUser();
      return { valid: true };
    } catch (error) {
      if (error instanceof ClockodoError && (error.httpStatus === 401 || error.httpStatus === 403)) {
        return { valid: false, error: 'Invalid Clockodo e-mail or API key.' };
      }
      const reason = error instanceof Error ? error.message : String(error);
      return { valid: false, error: `Could not verify the Clockodo connection: ${reason}` };
    }
  },
});

const MAX_IDENTIFICATION_LENGTH = 50;
