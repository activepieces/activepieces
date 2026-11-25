import { isNil, tryCatch } from '@activepieces/core-utils'
import { devServer } from './dev-server'
import { repoPaths } from './repo-paths'

async function check({ needs }: { needs: Need[] }): Promise<string | null> {
    const unset = missingEnv({ needs, env: process.env })
    const server = needs.includes('devServer') ? await serverProblems() : []
    return message({ problems: [...unset, ...server] })
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

async function serverProblems(): Promise<string[]> {
    const url = devServer.url()
    const apiKey = process.env[devServer.apiKeyEnv]
    const hasKey = !isNil(apiKey) && apiKey.length > 0
    const { data: res, error } = await tryCatch(() => fetch(`${url}${PING_PATH}`, { headers: hasKey ? { 'api-key': apiKey } : {}, signal: AbortSignal.timeout(PING_TIMEOUT_MS) }))
    if (!isNil(error)) {
        return [`no dev server answers at ${url}: start it, or point ${devServer.baseUrlEnv} at it`]
    }
    if (!hasKey) {
        return []
    }
    if (res.status === 401 || res.status === 403) {
        return [`${devServer.apiKeyEnv} does not match the dev server's AP_API_KEY (${PING_PATH} answered ${res.status})`]
    }
    return res.status === 404 ? [`the dev server at ${url} does not serve the eval routes (${PING_PATH} answered 404)`] : []
}

function message({ problems }: { problems: string[] }): string | null {
    if (problems.length === 0) {
        return null
    }
    return `Cannot run the evals. Fix these (environment or ${repoPaths.envFile()}) and run again:\n${problems.map((problem) => `  - ${problem}`).join('\n')}`
}

const OPENROUTER_API_KEY_ENV = 'OPENROUTER_API_KEY'
const OPENROUTER_PROVISION_ENV = 'AP_OPENROUTER_PROVISION_KEY'
const POSTHOG_API_KEY_ENV = 'AP_POSTHOG_API_KEY'
const POSTHOG_PROJECT_ENV = 'AP_POSTHOG_PROJECT_ID'
const DEFAULT_POSTHOG_PROJECT_ID = '18070'
const PING_PATH = '/v1/agents/eval/prompt-sources'
const PING_TIMEOUT_MS = 5_000

export const preflight = {
    check,
    missingEnv,
    message,
}

export type Need = 'devServer' | 'openRouter' | 'posthog'
