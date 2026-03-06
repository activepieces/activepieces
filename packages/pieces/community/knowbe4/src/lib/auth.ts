import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const KNOWBE4_REGIONS: Record<string, string> = {
  us: 'https://us.api.knowbe4.com',
  eu: 'https://eu.api.knowbe4.com',
  ca: 'https://ca.api.knowbe4.com',
  uk: 'https://uk.api.knowbe4.com',
  de: 'https://de.api.knowbe4.com',
};

export type KnowBe4Auth = {
  apiKey: string;
  region: string;
};

export const knowbe4Auth = PieceAuth.CustomAuth({
  displayName: 'KnowBe4 Authentication',
  description:
    'Enter your KnowBe4 Reporting API key and select your region. Find your API key in KSAT Console > Account Settings > Account Integrations > API.',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your KnowBe4 Reporting API key',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      description: 'The region where your KnowBe4 account is hosted',
      required: true,
      defaultValue: 'us',
      options: {
        disabled: false,
        options: [
          { label: 'United States', value: 'us' },
          { label: 'Europe', value: 'eu' },
          { label: 'Canada', value: 'ca' },
          { label: 'United Kingdom', value: 'uk' },
          { label: 'Germany', value: 'de' },
        ],
      },
    }),
  },
  validate: async ({ auth }) => {
    try {
      const baseUrl = KNOWBE4_REGIONS[auth.region] ?? KNOWBE4_REGIONS['us'];
      const response = await fetch(`${baseUrl}/v1/account`, {
        headers: {
          Authorization: `Bearer ${auth.apiKey}`,
        },
      });
      if (!response.ok) {
        return { valid: false, error: 'Invalid API key or wrong region.' };
      }
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Could not connect to KnowBe4 API.',
      };
    }
  },
});
