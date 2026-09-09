import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'
import { formErrors } from '../../form-errors'

export const PlatformConfiguration = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    isProductTelemetryEnabled: z.boolean(),
    isInfraSetupTelemetryEnabled: z.boolean(),
    maxBarrierSignals: z.number().int().min(1, formErrors.atLeastOne),
})
export type PlatformConfiguration = z.infer<typeof PlatformConfiguration>

export const UpdatePlatformConfigurationRequestBody = PlatformConfiguration.pick({
    isProductTelemetryEnabled: true,
    isInfraSetupTelemetryEnabled: true,
    maxBarrierSignals: true,
}).partial()
export type UpdatePlatformConfigurationRequestBody = z.infer<typeof UpdatePlatformConfigurationRequestBody>
