import { PieceMetadata } from '@activepieces/pieces-framework'
import axios from 'axios'
import { system } from '../system/system'
import { SystemProp } from '../system/system-prop'

const API_URL = system.getOrThrow(SystemProp.WEBHOOK_URL)

const client = axios.create({
    baseURL: API_URL,
})

export const pieceMetadataService = {
    async get({ name, version }: GetParams): Promise<PieceMetadata> {
        const response = await client.get<PieceMetadata>(`v1/pieces/${name}`, {
            params: {
                version,
            },
        })

        return response.data
    },
}

type GetParams = {
    name: string
    version: string
}
