import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'

export const PlatformConfiguration = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    isProductTelemetryEnabled: z.boolean(),
    isInfraSetupTelemetryEnabled: z.boolean(),
})
export type PlatformConfiguration = z.infer<typeof PlatformConfiguration>

export const UpdatePlatformConfigurationRequestBody = z.object({
    isProductTelemetryEnabled: z.boolean().optional(),
    isInfraSetupTelemetryEnabled: z.boolean().optional(),
})
export type UpdatePlatformConfigurationRequestBody = z.infer<typeof UpdatePlatformConfigurationRequestBody>
