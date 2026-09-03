import { PlatformConfiguration } from '@activepieces/shared';
import { z } from 'zod';

const toFormValues = (
  configuration: PlatformConfiguration,
): ConfigurationsFormValues => ({
  isProductTelemetryEnabled: configuration.isProductTelemetryEnabled,
  isInfraSetupTelemetryEnabled: configuration.isInfraSetupTelemetryEnabled,
});

export const configurationsForm = { toFormValues };

export const ConfigurationsFormValues = z.object({
  isProductTelemetryEnabled: z.boolean(),
  isInfraSetupTelemetryEnabled: z.boolean(),
});

export type ConfigurationsFormValues = z.infer<typeof ConfigurationsFormValues>;
