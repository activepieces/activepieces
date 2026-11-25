import { afterEach, describe, expect, it, vi } from 'vitest'
import { posthogConfig } from '../src/posthog-config'

describe('posthogConfig.projectToken', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('uses the built-in token when AP_POSTHOG_PROJECT_TOKEN is unset', () => {
        expect(posthogConfig.projectToken()).toBe(posthogConfig.meteringProjectToken)
    })

    it('uses the token that AP_POSTHOG_PROJECT_TOKEN names', () => {
        vi.stubEnv('AP_POSTHOG_PROJECT_TOKEN', 'phc_staging')

        expect(posthogConfig.projectToken()).toBe('phc_staging')
    })

    it('turns PostHog off when AP_POSTHOG_PROJECT_TOKEN is empty', () => {
        vi.stubEnv('AP_POSTHOG_PROJECT_TOKEN', '')

        expect(posthogConfig.projectToken()).toBeNull()
    })

    it('keeps the metering token whatever AP_POSTHOG_PROJECT_TOKEN says', () => {
        const builtIn = posthogConfig.projectToken()
        vi.stubEnv('AP_POSTHOG_PROJECT_TOKEN', '')

        expect(posthogConfig.meteringProjectToken).toBe(builtIn)
    })
})
