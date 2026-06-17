import { createAction, Property } from '@activepieces/pieces-framework';
import { chainalysisApiAuth } from '../..';

export const checkAddressSanction = createAction({
  name: 'checkAddressSanction',
  displayName: 'Check Address Sanctions',
  description: 'Check if an address is sanctioned',
  audience: 'both',
  aiMetadata: { description: 'Screens a single blockchain address against Chainalysis sanctions data to determine whether it is associated with a sanctioned entity. Use this when you need to verify the sanctions/compliance status of a wallet address before transacting or onboarding. Takes one address string; this is a read-only lookup and is safe to repeat.', idempotent: true },
  auth: chainalysisApiAuth,
  requireAuth: true,
  props: {
    address: Property.ShortText({
      displayName: 'Address',
      description: 'Address to check for sanctions',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const address = propsValue.address;
    const apiKey = auth.secret_text;

    try {
      const response = await fetch(`https://public.chainalysis.com/api/v1/address/${address}`, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[chainalysis-api-checkAddressSanction] Error checking address sanction:', error);
      throw error;
    }
  },
});