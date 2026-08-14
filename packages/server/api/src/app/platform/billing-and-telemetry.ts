import { isNil } from '@activepieces/core-utils'
import { ConsumableFeatureId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { BillingEventPayload, captureBillingEvent } from '../helper/telemetry.utils'
import { billingProvider, TrackAppSumoAiUsageParams, TrackCreditsParams, TrackFeatureParams } from './billing-provider'

export async function trackBillingAndSendTelemetry({ log, licenseKey, credits, appSumo, telemetry }: TrackBillingAndSendTelemetryParams): Promise<void> {
    const provider = billingProvider.get(log)
    const creditsEvent: TrackFeatureParams = { ...credits, featureId: ConsumableFeatureId.AP_CREDITS }
    const appSumoEvent: TrackFeatureParams | undefined = isNil(appSumo) ? undefined : { ...appSumo, featureId: ConsumableFeatureId.APP_SUMO_AI_CREDITS }
    const tracked = isNil(appSumoEvent) ? [creditsEvent] : [creditsEvent, appSumoEvent]
    await Promise.all(tracked.map((params) => provider.trackFeature(params)))
    if (isNil(licenseKey) || licenseKey.length === 0) {
        return
    }
    captureBillingEvent({ licenseKey, ...telemetry })
}

type TrackBillingAndSendTelemetryParams = {
    log: FastifyBaseLogger
    licenseKey: string | null | undefined
    credits: TrackCreditsParams
    appSumo?: TrackAppSumoAiUsageParams
    telemetry: BillingEventPayload
}
