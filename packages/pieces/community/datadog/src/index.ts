import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { constructDatadogBaseHeaders, constructDatadogBaseUrl, DatadogAuthType, getDatadogConfiguration } from "./lib/common";
import { sendMultipleLogs } from "./lib/actions/send-multiple-logs";
import { v1 } from "@datadog/datadog-api-client";
import { sendOneLog } from "./lib/actions/send-one-log";

export const datadogAuth = PieceAuth.CustomAuth({
  description: 'Datadog authentication requires an API key and a site (by default, US1).',
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
      const apiInstance = new v1.AuthenticationApi(getDatadogConfiguration(auth));

      await apiInstance.validate()
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

export const datadog = createPiece({
  displayName: "Datadog",
  description: "Cloud monitoring and analytics platform",
  auth: datadogAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/datadog.png",
  authors: ["chaimaa-kadaoui"],
  actions: [
    sendMultipleLogs,
    sendOneLog,
    createCustomApiCallAction({
      baseUrl: (auth) => constructDatadogBaseUrl(auth as DatadogAuthType),
      auth: datadogAuth,
      authMapping: async (auth) => constructDatadogBaseHeaders(auth as DatadogAuthType),
      authLocation: 'headers',
      props: {
        url: {
          description: `You can either use the full URL or the relative path to the base URL
i.e https://api.datadoghq.com/api/v2/resource or /resource.
When using the relative path, the default subdomain is "api" and the default version is "v2".`,
        }
      },
    }),
  ],
  triggers: [],
});
