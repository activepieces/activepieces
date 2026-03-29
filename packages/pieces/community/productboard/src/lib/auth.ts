import { PieceAuth, Property, Validators } from '@activepieces/pieces-framework';

export const productboardAuth = PieceAuth.SecretText({
  description: 'API Key from Productboard Settings',
  required: true,
  displayName: 'API Key',
  validators: [Validators.pattern(/\w+/)],
});

export const featureId = Property.Dropdown({
  displayName: 'Feature',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) return { disabled: true, options: [], placeholder: 'Enter API key' };

    try {
      const response = await fetch('https://api.productboard.com/v1/features', {
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      return {
        options: data.data?.map((feature: any) => ({
          label: feature.attributes?.name || feature.id,
          value: feature.id,
        })) || [],
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Error loading features' };
    }
  },
});
