import { isNil, tryCatch } from '@activepieces/core-utils'
import { devServer } from './dev-server'
import { repoPaths } from './repo-paths'

async function check({ needs }: { needs: Need[] }): Promise<string | null> {
    const unset = missingEnv({ needs, env: process.env })
    const unreachable = needs.includes('devServer') && !await answers({ url: devServer.url() }) ? [unreachableLine()] : []
    return message({ problems: [...unset, ...unreachable] })
}

function missingEnv({ needs, env }: { needs: Need[], env: Record<string, string | undefined> }): string[] {
    const isSet = (name: string): boolean => {
        const value = env[name]
        return !isNil(value) && value.length > 0
    }
    return [
        needs.includes('devServer') && !isSet(devServer.apiKeyEnv) ? `${devServer.apiKeyEnv} is not set: use the value the dev server runs with` : null,
        needs.includes('openRouter') && !isSet(OPENROUTER_API_KEY_ENV) && !isSet(OPENROUTER_PROVISION_ENV) ? `${OPENROUTER_API_KEY_ENV} (or ${OPENROUTER_PROVISION_ENV}) is not set: the agent and the judge run on OpenRouter` : null,
        needs.includes('posthog') && !isSet(POSTHOG_API_KEY_ENV) ? `${POSTHOG_API_KEY_ENV} is not set: the datasets and the main baseline are read from PostHog (project ${env[POSTHOG_PROJECT_ENV] ?? DEFAULT_POSTHOG_PROJECT_ID}, change it with ${POSTHOG_PROJECT_ENV})` : null,
    ].flatMap((line) => isNil(line) ? [] : [line])
}

function unreachableLine(): string {
    return `no dev server answers at ${devServer.url()}: start it, or point ${devServer.baseUrlEnv} at it`
}

function message({ problems }: { problems: string[] }): string | null {
    if (problems.length === 0) {
        return null
    }
    return `Cannot run the evals. Fix these (environment or ${repoPaths.envFile()}) and run again:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`
}

async function answers({ url }: { url: string }): Promise<boolean> {
    const { error } = await tryCatch(() => fetch(`${url}${PING_PATH}`, { signal: AbortSignal.timeout(PING_TIMEOUT_MS) }))
    return isNil(error)
}

const OPENROUTER_API_KEY_ENV = 'OPENROUTER_API_KEY'
const OPENROUTER_PROVISION_ENV = 'AP_OPENROUTER_PROVISION_KEY'
const POSTHOG_API_KEY_ENV = 'AP_POSTHOG_API_KEY'
const POSTHOG_PROJECT_ENV = 'AP_POSTHOG_PROJECT_ID'
const DEFAULT_POSTHOG_PROJECT_ID = '18070'
const PING_PATH = '/v1/flags'
const PING_TIMEOUT_MS = 5_000

export const preflight = {
    check,
    missingEnv,
    message,
}

export type Need = 'devServer' | 'openRouter' | 'posthog'
