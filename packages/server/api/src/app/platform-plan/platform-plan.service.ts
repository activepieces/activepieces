import { AppSystemProp } from '@activepieces/server-shared'
import { LanguageModelUsage } from 'ai'
import axios from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { authenticationUtils } from '../authentication/authentication-utils'
import { BuilderOpenAiModel } from '../builder/constants'
import { system } from '../helper/system/system'

type Quota = {
    available: {
        api_integrations: boolean
        automation_flow: boolean
        credits: boolean
        flow_executions: boolean
    }
}

type TokenUsage = {
    model: string
    component: 'AutomationX'
    usage: {
        inputTokens: number
        outputTokens: number
        totalTokens: number
    }
}

const fetchQuota = async (log: FastifyBaseLogger, zeroApiUrl: string, token: string): Promise<Quota> => {
    try {
        const url = `${zeroApiUrl}/automationx/v1/quota-check`
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        }

        const response = await axios.get<Quota>(url, { headers })
        return response.data
    }
    catch (error) {
        if (axios.isAxiosError(error)) {
            log.error(`Axios error calling quota check: ${error.message}`)
        }
        else {
            log.error(`Unknown error calling quota check: ${String(error)}`)
        }

        // Return default fallback quota
        return {
            available: {
                api_integrations: false,
                credits: false,
                automation_flow: true,
                flow_executions: true,
            },
        }
    }
}

const postTokenUsage = async (log: FastifyBaseLogger, zeroApiUrl: string, token: string, usage: TokenUsage): Promise<void> => {
    const url = `${zeroApiUrl}/automationx/v1/token-used`
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(usage),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to post token usage: ${response.statusText} ${errorText}`)
        }
    }
    catch (error) {
        log.error(`Error posting token usage: ${(error as Error).message}`)
    }
}

export const platformPlanService = (log: FastifyBaseLogger) => {
    const isStandaloneVersion = system.isStandaloneVersion()
    const zeroApiUrl = system.get(AppSystemProp.ZERO_SERVICE_URL)

    log.info({ isStandaloneVersion }, 'quota check init')

    return {
        async flowsExceeded(projectId: string): Promise<boolean> {
            if (isStandaloneVersion) return false
            const projectUserToken = await authenticationUtils.getProjectOwnerAndToken(projectId)
            const quota = await fetchQuota(log, zeroApiUrl!, projectUserToken.token)
            log.debug(quota.available, 'available quota check response for flowsExceeded')
            return !quota.available.automation_flow
        },
        async flowRunsExceeded(projectId: string): Promise<boolean> {
            if (isStandaloneVersion) return false
            const projectUserToken = await authenticationUtils.getProjectOwnerAndToken(projectId)
            const quota = await fetchQuota(log, zeroApiUrl!, projectUserToken.token)
            log.debug(quota.available, 'available quota check response for flowRunsExceeded')
            return !quota.available.flow_executions
        },
        async publishTokenUsage(projectId: string, usage: LanguageModelUsage): Promise<void> {
            if (isStandaloneVersion) return
            if (!usage.inputTokens || !usage.outputTokens) {
                log.warn('no token usage found while publishing to promptx')
                return
            }
            const projectUserToken = await authenticationUtils.getProjectOwnerAndToken(projectId)
            const tokenUsage: TokenUsage = {
                model: BuilderOpenAiModel,
                component: 'AutomationX',
                usage: {
                    inputTokens: usage.inputTokens,
                    outputTokens: usage.outputTokens,
                    totalTokens: usage.totalTokens ?? usage.inputTokens + usage.outputTokens,
                },
            }
            await postTokenUsage(log, zeroApiUrl!, projectUserToken.token, tokenUsage)
        },
    }
}
