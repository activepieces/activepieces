import { AppSystemProp } from '@activepieces/server-shared'
import axios from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { authenticationUtils } from '../authentication/authentication-utils'
import { system } from '../helper/system/system'

type Quota = {
    available: {
        api_integrations: boolean
        automation_flow: boolean
        credits: boolean
        flow_executions: boolean
    }
}

const fetchQuota = async (log: FastifyBaseLogger, zeroApiUrl: string, token: string): Promise<Quota> => {
    try {
        const url = `${zeroApiUrl}/pmtx-ai-token-api/v1/quota-check`
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
    }
}
