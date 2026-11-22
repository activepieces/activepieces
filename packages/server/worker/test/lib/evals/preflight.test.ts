import { afterEach, describe, expect, it, vi } from 'vitest'
import { preflight } from './preflight'

describe('preflight', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.unstubAllEnvs()
    })

    it('lists every missing variable a full run needs', () => {
        const missing = preflight.missingEnv({ needs: ['devServer', 'openRouter', 'posthog'], env: {} })

        expect(missing).toEqual([
            'AP_API_KEY is not set: use the value the dev server runs with',
            'OPENROUTER_API_KEY (or AP_OPENROUTER_PROVISION_KEY) is not set: the agent and the judge run on OpenRouter',
            'AP_POSTHOG_API_KEY is not set: the datasets and the main baseline are read from PostHog (project 18070, change it with AP_POSTHOG_PROJECT_ID)',
        ])
    })

    it('accepts the OpenRouter provisioning key instead of an inference key, and asks only for what the mode needs', () => {
        expect(preflight.missingEnv({ needs: ['devServer', 'openRouter', 'posthog'], env: { AP_API_KEY: 'k', AP_OPENROUTER_PROVISION_KEY: 'p', AP_POSTHOG_API_KEY: 'ph' } })).toEqual([])
        expect(preflight.missingEnv({ needs: ['posthog'], env: { AP_POSTHOG_API_KEY: 'ph' } })).toEqual([])
    })

    it('reports an unreachable dev server with the missing variables in one message', async () => {
        vi.stubEnv('AP_API_KEY', '')
        vi.stubEnv('OPENROUTER_API_KEY', 'or')
        vi.stubEnv('AP_POSTHOG_API_KEY', 'ph')
        vi.stubEnv('AP_EVAL_BASE_URL', 'http://localhost:3999/api')
        vi.stubGlobal('fetch', async () => {
            throw new TypeError('fetch failed')
        })

        const message = await preflight.check({ needs: ['devServer', 'openRouter', 'posthog'] })

        expect(message).toContain('Cannot run the evals.')
        expect(message).toContain('  - AP_API_KEY is not set')
        expect(message).toContain('  - no dev server answers at http://localhost:3999/api: start it, or point AP_EVAL_BASE_URL at it')
        expect(message).not.toContain('OPENROUTER_API_KEY')
    })

    it('says nothing when everything is set and the dev server answers', async () => {
        vi.stubEnv('AP_API_KEY', 'k')
        vi.stubEnv('OPENROUTER_API_KEY', 'or')
        vi.stubEnv('AP_POSTHOG_API_KEY', 'ph')
        const headers: unknown[] = []
        vi.stubGlobal('fetch', async (_url: string, init: { headers: unknown }) => {
            headers.push(init.headers)
            return new Response('{}', { status: 200 })
        })

        expect(await preflight.check({ needs: ['devServer', 'openRouter', 'posthog'] })).toBeNull()
        expect(headers).toEqual([{ 'api-key': 'k' }])
    })

    it('reports an API key the dev server rejects', async () => {
        vi.stubEnv('AP_API_KEY', 'wrong')
        vi.stubEnv('OPENROUTER_API_KEY', 'or')
        vi.stubEnv('AP_POSTHOG_API_KEY', 'ph')
        vi.stubGlobal('fetch', async () => new Response('{"message":"Forbidden"}', { status: 403 }))

        const message = await preflight.check({ needs: ['devServer', 'openRouter', 'posthog'] })

        expect(message).toContain("AP_API_KEY does not match the dev server's AP_API_KEY (/v1/agents/eval/prompt-sources answered 403)")
    })
})
