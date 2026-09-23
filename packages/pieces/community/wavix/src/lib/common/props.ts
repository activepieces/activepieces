import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wavixAuth } from './auth';
import { wavixApiCall } from './client';

/**
 * Dropdown of the phone numbers on the connected account.
 * Value is the numeric number id.
 */
export const numberDropdown = Property.Dropdown({
  displayName: 'Phone Number',
  description: 'The number on your account to watch.',
  required: true,
  auth: wavixAuth,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Wavix account first',
        options: [],
      };
    }
    try {
      const perPage = 100;
      const numbers: { id: number; number: string }[] = [];
      // Page through all numbers so large accounts aren't truncated.
      for (let page = 1; page <= 100; page++) {
        const response = await wavixApiCall<{
          items: { id: number; number: string }[];
        }>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          resourcePath: '/v1/numbers',
          query: { page: String(page), per_page: String(perPage) },
        });
        numbers.push(...response.items);
        if (response.items.length < perPage) {
          break;
        }
      }
      return {
        options: numbers.map((n) => ({
          label: n.number,
          value: n.id,
        })),
      };
    } catch {
      return {
        disabled: true,
        placeholder: 'Could not load your Wavix numbers — check the API key.',
        options: [],
      };
    }
  },
});
