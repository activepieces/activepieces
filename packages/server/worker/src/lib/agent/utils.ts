import { AIProviderName, GetProviderConfigResponse } from '@activepieces/shared'
import { LanguageModelV3 } from '@ai-sdk/provider'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { ApAxiosClient } from '../api/ap-axios'
import { workerMachine } from '../utils/machine'

const removeTrailingSlash = (url: string): string => {
    return url.endsWith('/') ? url.slice(0, -1) : url
}

export const agentUtils = {
    async getModel(modelId: string, engineToken: string): Promise<LanguageModelV3> {

        const client = new ApAxiosClient(
            removeTrailingSlash(workerMachine.getInternalApiUrl()),
            engineToken,
        )
        const response = await client.get<GetProviderConfigResponse>(
            `/v1/ai-providers/${AIProviderName.ACTIVEPIECES}/config`,
            {},
        )

        return createOpenRouter({ apiKey: response.auth.apiKey }).chat(modelId)
    },
}