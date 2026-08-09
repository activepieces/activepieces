import { DispatchChildRunRequest, DispatchChildRunResponse } from '@activepieces/shared'
import { throwForRejectedRequest } from './rejected-request'

export const childRunClient = {
    dispatch: async ({ apiUrl, engineToken, ...body }: DispatchChildRunClientRequest): Promise<DispatchChildRunResponse> => {
        const response = await fetch(`${apiUrl}v1/flow-runs/dispatch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${engineToken}`,
            },
            body: JSON.stringify(body),
        })
        if (!response.ok) {
            await throwForRejectedRequest({ response, name: 'ChildRunDispatchError', summary: 'Failed to dispatch a batch' })
        }
        return response.json() as Promise<DispatchChildRunResponse>
    },
}

type DispatchChildRunClientRequest = DispatchChildRunRequest & {
    apiUrl: string
    engineToken: string
}
