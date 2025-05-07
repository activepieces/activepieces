import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BEEHIIV_API_URL = 'https://api.beehiiv.com/v2';

export const beehiivAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your beehiiv API key',
  required: true,
});

export interface BeehiivPublication {
  id: string;
  name: string;
  domain: string;
  created: number;
  active: boolean;
}

export const publicationIdProperty = Property.Dropdown({
  displayName: 'Publication',
  description: 'The publication to use',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please enter your API key first',
        options: [],
      };
    }

    try {
      const response = await httpClient.sendRequest<{
        data: BeehiivPublication[];
      }>({
        method: HttpMethod.GET,
        url: `${BEEHIIV_API_URL}/publications`,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });

      return {
        options: response.body.data.map((publication) => {
          return {
            label: publication.name,
            value: publication.id,
          };
        }),
      };
    } catch (error) {
      console.error('Error fetching publications:', error);
      return {
        disabled: true,
        placeholder: 'Error fetching publications',
        options: [],
      };
    }
  },
});
