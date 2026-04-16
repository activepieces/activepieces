import { Letta } from '@letta-ai/letta-client'
import { LettaAuthType } from './auth'
import type { ClientOptions } from './types'

export function getLettaClient(auth: LettaAuthType): Letta {
    const clientConfig: ClientOptions = {}

    if (auth.apiKey) {
        clientConfig.apiKey = auth.apiKey
    }

    if (auth.baseUrl) {
        clientConfig.baseURL = auth.baseUrl
    }

    return new Letta(clientConfig)
}
