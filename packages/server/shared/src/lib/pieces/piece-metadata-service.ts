import { PieceMetadata } from '@activepieces/pieces-framework'
import axios from 'axios'

export const pieceMetadataService = {
    async get({ name, version }: GetParams): Promise<PieceMetadata> {
        const response = await axios.get<PieceMetadata>(`https://clould.activepieces.com/api/pieces/${name}`, {
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
