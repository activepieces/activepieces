import { EngineConstants } from '../handler/context/engine-constants'
import { AppConnection, AppConnectionType, CloudOAuth2ConnectionValue, BasicAuthConnectionValue, OAuth2ConnectionValueWithApp } from '@activepieces/shared'

export const createConnectionService = ({ projectId, workerToken }: { projectId: string, workerToken: string }) => {
    return {
        async obtain(connectionName: string): Promise<null | OAuth2ConnectionValueWithApp | CloudOAuth2ConnectionValue | BasicAuthConnectionValue | string | Record<string, unknown>> {
            const url = `${EngineConstants.API_URL}v1/worker/app-connections/${encodeURIComponent(connectionName)}?projectId=${projectId}`
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Authorization: 'Bearer ' + workerToken,
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
}
