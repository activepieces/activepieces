import { AIProviderName, GetProviderConfigResponse } from "@activepieces/shared"
import { ApAxiosClient } from "../api/ap-axios"
import { workerMachine } from "../utils/machine"
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { LanguageModelV2 } from '@ai-sdk/provider'

const removeTrailingSlash = (url: string): string => {
    return url.endsWith('/') ? url.slice(0, -1) : url
}

export const agentUtils = {
    async getModel(modelId: string): Promise<LanguageModelV2> {

        const client = new ApAxiosClient(
            removeTrailingSlash(workerMachine.getInternalApiUrl()),
            workerMachine.getWorkerToken()
        );
        const response = await client.get<GetProviderConfigResponse>(
            `/v1/ai-providers/${AIProviderName.ACTIVEPIECES}/config`,
            {}
        );

        return createOpenRouter({ apiKey: response.auth.apiKey }).chat(modelId)
    }
}