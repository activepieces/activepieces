import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { getDatadogConfiguration } from './helpers';
import { AppConnectionType } from '@activepieces/shared';
import { v1 } from '@datadog/datadog-api-client';

export const datadogAuth = PieceAuth.CustomAuth({
  description:
    'Datadog authentication requires an API key and a site (by default, US1).',
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'Datadog API key',
      required: true,
    }),
    appKey: PieceAuth.SecretText({
      displayName: 'Datadog App key (required for some endpoints)',
      required: false,
    }),
    site: Property.StaticDropdown({
      displayName: 'Site',
      required: true,
      defaultValue: 'datadoghq.com',
      options: {
        options: [
          { label: 'US1', value: 'datadoghq.com' },
          { label: 'US3', value: 'us3.datadoghq.com' },
          { label: 'US5', value: 'us5.datadoghq.com' },
          { label: 'EU', value: 'datadoghq.eu' },
          { label: 'AP1', value: 'ap1.datadoghq.com' },
          { label: 'AP2', value: 'ap2.datadoghq.com' },
          { label: 'US1-FED', value: 'ddog-gov.com' },
        ],
      },
    }),
  },

  validate: async ({ auth }) => {
    /**
     * Documentation: https://docs.datadoghq.com/api/latest/authentication/?code-lang=typescript
     */
    try {
      const apiInstance = new v1.AuthenticationApi(
        getDatadogConfiguration({
          type: AppConnectionType.CUSTOM_AUTH,
          props: auth,
        })
      );

      await apiInstance.validate();
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid auth credentials',
      };
    }
  },
});
