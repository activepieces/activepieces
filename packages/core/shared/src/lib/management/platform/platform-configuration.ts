import { BaseModelSchema, isNil } from '@activepieces/core-utils'
import { z } from 'zod'
import { formErrors } from '../../form-errors'

const MIN_BARRIER_SIGNALS = 1
const MAX_BARRIER_SIGNALS = 10_000

export const PlatformConfiguration = z.object({
    ...BaseModelSchema,
    platformId: z.string(),
    isProductTelemetryEnabled: z.boolean(),
    isInfraSetupTelemetryEnabled: z.boolean(),
    maxBarrierSignals: z
        .int({ error: (issue) => isNil(issue.input) ? formErrors.required : formErrors.wholeNumber })
        .min(MIN_BARRIER_SIGNALS, formErrors.atLeastOne)
        .max(MAX_BARRIER_SIGNALS, formErrors.atMostTenThousand),
})
export type PlatformConfiguration = z.infer<typeof PlatformConfiguration>

export const PlatformConfigurationSettings = PlatformConfiguration.pick({
    isProductTelemetryEnabled: true,
    isInfraSetupTelemetryEnabled: true,
    maxBarrierSignals: true,
})
export type PlatformConfigurationSettings = z.infer<typeof PlatformConfigurationSettings>

export const UpdatePlatformConfigurationRequestBody = PlatformConfigurationSettings.partial()
export type UpdatePlatformConfigurationRequestBody = z.infer<typeof UpdatePlatformConfigurationRequestBody>

export const maxBarrierSignalsBounds = {
    min: MIN_BARRIER_SIGNALS,
    max: MAX_BARRIER_SIGNALS,
}
