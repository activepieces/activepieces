import { EngineGenericError, FanOutBranchesRequest, FanOutBranchesResponse } from '@activepieces/shared'

export const branchClient = {
    fanOut: async ({ apiUrl, engineToken, ...body }: FanOutClientRequest): Promise<FanOutBranchesResponse> => {
        const response = await fetch(`${apiUrl}v1/flow-runs/branches`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${engineToken}`,
            },
            body: JSON.stringify(body),
        })
        if (!response.ok) {
            throw new EngineGenericError('BranchFanOutError', `Failed to fan out loop branches: ${response.status} ${response.statusText}`)
        }
        return response.json() as Promise<FanOutBranchesResponse>
    },
}

type FanOutClientRequest = FanOutBranchesRequest & {
    apiUrl: string
    engineToken: string
}
