import { AppConnection, AppConnectionType, CloudOAuth2ConnectionValue, BasicAuthConnectionValue, OAuth2ConnectionValueWithApp, ExecutionState } from '@activepieces/shared'
import { globals } from '../globals'

export const createConnectionManager = (state: ExecutionState) => {
    return {
        get: async (key: string) => {
            try {
                const connection = await connectionService.obtain(key)
                state.addConnectionTags([key])
                if (!connection) {
                    return null
                }
                return connection
            }
            catch (e) {
                return null
            }
        },
    }
}

export const connectionService = {
    async obtain(connectionName: string): Promise<null | OAuth2ConnectionValueWithApp | CloudOAuth2ConnectionValue | BasicAuthConnectionValue | string | Record<string, unknown>> {
        const url = globals.apiUrl + `v1/worker/app-connections/${encodeURIComponent(connectionName)}?projectId=${globals.projectId}`
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + globals.workerToken,
                },
            })
            if (!response.ok) {
                throw new Error('Connection information failed to load. URL: ' + url)
            }
            const result: AppConnection | null = await response.json()
            if (result === null) {
                return null
            }
            if (result.value.type === AppConnectionType.SECRET_TEXT) {
                return result.value.secret_text
            }
            if (result.value.type === AppConnectionType.CUSTOM_AUTH) {
                return result.value.props
            }
            return result.value
        }
        catch (e) {
            throw new Error('Connection information failed to load. URL: ' + url + ' Error: ' + e)
        }
    },
}
