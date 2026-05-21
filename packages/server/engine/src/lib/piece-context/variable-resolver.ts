import { EngineGenericError, ExecutionError, FetchError } from '@activepieces/shared'
import { utils } from '../utils'

export const createVariableResolver = ({ projectId: _projectId, engineToken, apiUrl }: CreateVariableResolverParams): VariableResolver => {
    return {
        async obtain(name: string): Promise<string> {
            const url = `${apiUrl}v1/worker/variables/${encodeURIComponent(name)}`

            const { data: value, error: fetchError } = await utils.tryCatchAndThrowOnEngineError((async () => {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${engineToken}`,
                    },
                })

                if (!response.ok) {
                    return handleResponseError({ name, httpStatus: response.status })
                }
                const body = await response.json() as { value: string }
                return body.value
            }))

            if (fetchError) {
                if (fetchError instanceof ExecutionError) {
                    throw fetchError
                }
                throw new FetchError(url, fetchError)
            }
            return value
        },
    }
}

const handleResponseError = ({ name, httpStatus }: { name: string, httpStatus: number }): never => {
    throw new EngineGenericError(`Variable ${name} could not be resolved (HTTP ${httpStatus})`)
}

type VariableResolver = {
    obtain(name: string): Promise<string>
}

type CreateVariableResolverParams = {
    projectId: string
    apiUrl: string
    engineToken: string
}
