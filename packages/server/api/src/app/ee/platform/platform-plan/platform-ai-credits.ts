import { FastifyBaseLogger } from "fastify"
import { OpenRouter } from '@openrouter/sdk';
import { system } from "../../../helper/system/system";
import { AppSystemProp } from "@activepieces/server-shared";
import { platformPlanService } from "./platform-plan.service";
import { assertNotNullOrUndefined, isNil } from "@activepieces/shared";

let openRouter: OpenRouter | undefined

export function openRouterInstance(): OpenRouter {
    if (!openRouter) {
        openRouter = new OpenRouter({
            apiKey: system.getOrThrow(AppSystemProp.OPENROUTER_API_KEY),
        })
    }
    return openRouter
}
export const platformAiCreditsService = (log: FastifyBaseLogger) => ({
    async isEnabled(): Promise<boolean> {
        return !isNil(system.get(AppSystemProp.OPENROUTER_API_KEY))
    },
    async getUsage(platformId: string): Promise<APIKeyUsage> {
        const response = await platformAiCreditsService(log).provisionKeyIfNeeded(platformId)
        const usage = await openRouterInstance().apiKeys.get({
            hash: response.hash,
        })
        assertNotNullOrUndefined(usage.data.usageMonthly, 'Usage monthly is not set')
        assertNotNullOrUndefined(usage.data.limit, 'Limit is not set')
        assertNotNullOrUndefined(usage.data.limitRemaining, 'Limit remaining is not set')   
        return {
            usageMonthly: usage.data.usageMonthly * 1000,
            limitMonthly: usage.data.limit * 1000,
            limitRemaining: usage.data.limitRemaining * 1000,
        }   
    },
    async provisionKeyIfNeeded(platformId: string): Promise<ProvisionKeyResponse> {
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const openRouterApiKey = platformPlan.openRouterApiKey
        const openRouterApiKeyHash = platformPlan.openRouterApiKeyHash
        if (isNil(openRouterApiKey) || isNil(openRouterApiKeyHash)) {
            const limit = (platformPlan.aiCreditsOverageLimit ?? 0) + platformPlan.includedAiCredits;
            const { key, data } = await openRouterInstance().apiKeys.create({
                name: `Platform ${platformId}`,
                limit,
                limitReset: 'monthly',
            })
            await platformPlanService(log).update({
                platformId,
                openRouterApiKeyHash: data.hash,
                openRouterApiKey: key,
            })
            return { key, hash: data.hash };
        }
        return { key: openRouterApiKey, hash: openRouterApiKeyHash };
    }
})

type ProvisionKeyResponse = {
    key: string
    hash: string
}

type APIKeyUsage = {
    usageMonthly: number
    limitMonthly: number
    limitRemaining: number
}