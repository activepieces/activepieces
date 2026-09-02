import { PlatformConfiguration } from '@activepieces/shared';
import { z } from 'zod';

const toFormValues = (
  configuration: PlatformConfiguration,
): ConfigurationsFormValues => ({
  isProductTelemetryEnabled: configuration.isProductTelemetryEnabled,
});

export const configurationsForm = { toFormValues };

export const ConfigurationsFormValues = z.object({
  isProductTelemetryEnabled: z.boolean(),
});

export type ConfigurationsFormValues = z.infer<typeof ConfigurationsFormValues>;
