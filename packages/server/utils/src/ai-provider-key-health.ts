import { isNil, ProviderOutcomeReporter, ProviderOutcomeSignal } from '@activepieces/core-utils'

export function keyHealthReporterFor({ platformId, providerConfigId }: KeyHealthTarget): ProviderOutcomeReporter | undefined {
    const sink = reporter
    if (isNil(sink) || isNil(platformId) || isNil(providerConfigId)) {
        return undefined
    }
    return (signal) => sink({ platformId, providerConfigId, signal })
}

let reporter: KeyHealthReporter | undefined

export const aiProviderKeyHealth = {
    setReporter: (next: KeyHealthReporter): void => {
        reporter = next
    },
}

export type KeyHealthObservation = {
    platformId: string
    providerConfigId: string
    signal: ProviderOutcomeSignal
}

export type KeyHealthReporter = (observation: KeyHealthObservation) => void

export type KeyHealthTarget = {
    platformId?: string
    providerConfigId?: string
}
