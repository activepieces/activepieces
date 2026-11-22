import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { BokioError, bokioClient } from './client';

async function validateBokioAuth({
  companyId,
  apiKey,
}: {
  companyId: string;
  apiKey: string;
}): Promise<{ valid: true } | { valid: false; error: string }> {
  if (companyId.trim().length === 0 || apiKey.trim().length === 0) {
    return { valid: false, error: 'Enter both the Company ID and the API Key.' };
  }
  try {
    await bokioClient.request({
      auth: { companyId, api_key: apiKey },
      method: HttpMethod.GET,
      path: '/journal-entries',
      queryParams: { page: '1', pageSize: '1' },
      operation: 'connection check',
    });
    return { valid: true };
  } catch (error) {
    if (error instanceof BokioError) {
      if (error.httpStatus === 401) {
        return {
          valid: false,
          error: 'Invalid or expired API Key. Create a new private integration token in Bokio.',
        };
      }
      if (error.httpStatus === 404) {
        return {
          valid: false,
          error: 'Company not found, or this token has no access to it. Check the Company ID (UUID from the Bokio app URL) and that the token was created in that company.',
        };
      }
      return { valid: false, error: error.message };
    }
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Could not reach Bokio.',
    };
  }
}

export const bokioAuth = PieceAuth.CustomAuth({
  displayName: 'Bokio API Key',
  description:
    'In Bokio, open Settings → Integrations and create a private integration token for the company. The Company ID is the UUID in the Bokio app URL.',
  required: true,
  props: {
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'Your Bokio Company ID (UUID)',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Bokio private integration token',
      required: true,
    }),
  },
  validate: async ({ auth }) =>
    validateBokioAuth({ companyId: auth.companyId, apiKey: auth.api_key }),
});
